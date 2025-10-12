import { FlowCore } from '../../flow-core';
import { EdgeLabel, Node, Port, Size } from '../../types';
import { Updater } from '../updater.interface';
import { InitState } from './init-state';
import { LateArrivalQueue } from './late-arrival-queue';
import { StabilityDetector } from './stability-detector';

/** Milliseconds to wait after last entity addition before considering entities stabilized */
const STABILITY_DELAY = 50;

/**
 * InitUpdater batches all initialization data and applies it in a single state update.
 *
 * Strategy:
 * 1. Wait for entity creation to stabilize (addPort, addEdgeLabel) using StabilityDetectors
 * 2. Immediately collect measurements (applyNodeSize, applyPortsSizesAndPositions, applyEdgeLabelSize)
 * 3. Finish when: entities stabilized AND all entities have measurements
 * 4. Apply everything in one setState
 * 5. Queue late arrivals to prevent data loss during finish transition
 */
export class InitUpdater implements Updater {
  /** Flag indicating whether initialization has completed */
  public isInitialized = false;

  /** Flag indicating whether entity additions (ports/labels) have stabilized */
  private entitiesStabilized = false;

  /** Detects when port additions have stabilized */
  private portStabilityDetector: StabilityDetector;

  /** Detects when label additions have stabilized */
  private labelStabilityDetector: StabilityDetector;

  /** Collects all initialization data and applies it to diagram state */
  private initState: InitState;

  /** Queues updates that arrive during finish to prevent data loss */
  private lateArrivalQueue: LateArrivalQueue;

  /** Callback to execute when initialization completes */
  private onCompleteCallback?: () => void | Promise<void>;

  /**
   * Creates a new InitUpdater.
   * Initializes stability detectors based on whether nodes/edges exist.
   *
   * @param flowCore - The FlowCore instance to update
   */
  constructor(private flowCore: FlowCore) {
    const state = flowCore.getState();
    const hasNodes = state.nodes.length > 0;
    const hasEdges = state.edges.length > 0;

    this.portStabilityDetector = new StabilityDetector(hasNodes, STABILITY_DELAY);
    this.labelStabilityDetector = new StabilityDetector(hasEdges, STABILITY_DELAY);

    this.initState = new InitState();
    this.lateArrivalQueue = new LateArrivalQueue();
  }

  /**
   * Starts the initialization process.
   * Collects pre-existing measurements and waits for entity additions to stabilize.
   *
   * @param onComplete - Optional callback to execute after initialization completes
   */
  start(onComplete?: () => void | Promise<void>) {
    this.onCompleteCallback = onComplete;

    const state = this.flowCore.getState();
    this.initState.collectAlreadyMeasuredItems(state.nodes, state.edges);

    Promise.all([this.portStabilityDetector.waitForStability(), this.labelStabilityDetector.waitForStability()])
      .then(() => {
        this.entitiesStabilized = true;
        this.tryFinish();
      })
      .catch((err) => {
        console.error('[InitUpdater] Entity stabilization failed:', err);
        this.forceFinish();
      });
  }

  /**
   * Records a node size measurement.
   * Queues the update if finishing is in progress, otherwise records and attempts to finish.
   *
   * @param nodeId - The node ID
   * @param size - The measured size
   */
  applyNodeSize(nodeId: string, size: NonNullable<Node['size']>): void {
    if (this.lateArrivalQueue.isFinishing) {
      this.lateArrivalQueue.enqueue({ method: 'applyNodeSize', args: [nodeId, size] });
      return;
    }

    this.initState.trackNodeMeasurement(nodeId, size);
    this.tryFinish();
  }

  /**
   * Adds a new port created during initialization.
   * Queues if finishing, otherwise adds to init state and notifies stability detector.
   *
   * @param nodeId - The node ID the port belongs to
   * @param port - The port to add
   */
  addPort(nodeId: string, port: Port): void {
    if (this.lateArrivalQueue.isFinishing) {
      this.lateArrivalQueue.enqueue({ method: 'addPort', args: [nodeId, port] });
      return;
    }

    this.initState.addPort(nodeId, port);
    this.portStabilityDetector.notify();
  }

  /**
   * Records port measurements (sizes and positions).
   * Queues if finishing, otherwise records all measurements and attempts to finish.
   *
   * @param nodeId - The node ID the ports belong to
   * @param ports - Array of port measurements
   */
  applyPortsSizesAndPositions(nodeId: string, ports: NonNullable<Pick<Port, 'id' | 'size' | 'position'>>[]): void {
    if (this.lateArrivalQueue.isFinishing) {
      this.lateArrivalQueue.enqueue({ method: 'applyPortsSizesAndPositions', args: [nodeId, ports] });
      return;
    }

    for (const { id, size, position } of ports) {
      if (!size || !position) continue;
      this.initState.trackPortMeasurement(nodeId, id, size, position);
    }

    this.tryFinish();
  }

  /**
   * Adds a new edge label created during initialization.
   * Queues if finishing, otherwise adds to init state and notifies stability detector.
   *
   * @param edgeId - The edge ID the label belongs to
   * @param label - The label to add
   */
  addEdgeLabel(edgeId: string, label: EdgeLabel): void {
    if (this.lateArrivalQueue.isFinishing) {
      this.lateArrivalQueue.enqueue({ method: 'addEdgeLabel', args: [edgeId, label] });
      return;
    }

    this.initState.addLabel(edgeId, label);
    this.labelStabilityDetector.notify();
  }

  /**
   * Records an edge label size measurement.
   * Queues if finishing, otherwise records measurement and attempts to finish.
   *
   * @param edgeId - The edge ID the label belongs to
   * @param labelId - The label ID
   * @param size - The measured size
   */
  applyEdgeLabelSize(edgeId: string, labelId: string, size: Size): void {
    if (this.lateArrivalQueue.isFinishing) {
      this.lateArrivalQueue.enqueue({ method: 'applyEdgeLabelSize', args: [edgeId, labelId, size] });
      return;
    }

    this.initState.trackLabelMeasurement(edgeId, labelId, size);
    this.tryFinish();
  }

  /**
   * Attempts to finish initialization if conditions are met.
   * Conditions: not already finishing, not initialized, entities stabilized, all entities measured.
   */
  private tryFinish() {
    if (this.lateArrivalQueue.isFinishing || this.isInitialized) {
      return;
    }

    if (!this.entitiesStabilized) {
      return;
    }

    const state = this.flowCore.getState();
    if (this.initState.allEntitiesHaveMeasurements(state.nodes.length)) {
      this.finish();
    }
  }

  /**
   * Completes initialization by applying all collected data.
   * Marks as finishing, applies state, executes callback, marks as initialized, processes late arrivals.
   */
  private async finish() {
    this.lateArrivalQueue.startFinishing();

    this.initState.applyToDiagramState(this.flowCore);

    if (this.onCompleteCallback) {
      await this.onCompleteCallback();
    }

    this.isInitialized = true;

    this.lateArrivalQueue.processAll(this.flowCore.internalUpdater);
  }

  /**
   * Forces initialization to finish even if conditions aren't fully met.
   * Used as a fallback when entity stabilization fails.
   */
  private forceFinish() {
    this.finish();
  }
}
