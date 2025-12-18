import { FlowCore } from '../../flow-core';
import { Edge, EdgeLabel, Node, Port, Size } from '../../types';
import { Updater } from '../updater.interface';
import { InitState } from './init-state';
import { LateArrivalQueue } from './late-arrival-queue';
import { StabilityDetector } from './stability-detector';

/** Milliseconds to wait after last entity addition before considering entities stabilized */
export const STABILITY_DELAY = 50;

/** Milliseconds to wait for measurements after entities stabilize before forcing finish */
export const MEASUREMENT_TIMEOUT = 2000;

const INIT_STABILIZATION_FAILED_ERROR = (error: unknown) =>
  `[ngDiagram] Initialization stabilization failed.

Error: ${error instanceof Error ? error.message : String(error)}

The diagram will force-finish initialization without waiting for all measurements.
This may result in:
  • Ports without measured positions/sizes
  • Edge labels without measured sizes
  • Incorrect initial edge routing

This usually indicates:
  • Resize observers not functioning properly
  • Port/label elements not rendering
  • Very slow initial render (> ${STABILITY_DELAY}ms between additions)

The diagram will still be functional, but initial layout may be incomplete.

Documentation: https://www.ngdiagram.dev/docs/guides/model-initialization/
`;

/**
 * InitUpdater batches all initialization data and applies it in a single state update.
 *
 * Strategy:
 * 1. Wait for entity creation to stabilize (addPort, addEdgeLabel) using StabilityDetectors
 * 2. Immediately collect measurements (applyNodeSize, applyPortsSizesAndPositions, applyEdgeLabelSize)
 * 3. Finish when: entities stabilized AND all rendered entities have measurements
 * 4. Apply everything in one setState
 * 5. Queue late arrivals to prevent data loss during finish transition
 * 6. Safety timeout: If measurements don't arrive within MEASUREMENT_TIMEOUT, force finish
 *
 * Note: With virtualization, only rendered nodes/edges are tracked for initialization.
 * Non-rendered elements will be initialized when they become visible.
 */
export class InitUpdater implements Updater {
  /** Flag indicating whether initialization has completed */
  public isInitialized = false;

  /** Flag indicating whether entity additions (ports/labels) have stabilized */
  private entitiesStabilized = false;

  /** Detects when port additions have stabilized */
  private portStabilityDetector!: StabilityDetector;

  /** Detects when label additions have stabilized */
  private labelStabilityDetector!: StabilityDetector;

  /** Collects all initialization data and applies it to diagram state */
  private initState: InitState;

  /** Queues updates that arrive during finish to prevent data loss */
  private lateArrivalQueue: LateArrivalQueue;

  /** Callback to execute when initialization completes */
  private onCompleteCallback?: () => void | Promise<void>;

  /** Number of rendered nodes (captured at start for measurement tracking) */
  private renderedNodeCount = 0;

  /** Safety timeout to prevent indefinite waiting for measurements */
  private measurementTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Creates a new InitUpdater.
   *
   * @param flowCore - The FlowCore instance to update
   */
  constructor(private flowCore: FlowCore) {
    this.initState = new InitState();
    this.lateArrivalQueue = new LateArrivalQueue();
  }

  /**
   * Starts the initialization process.
   * Collects pre-existing measurements and waits for entity additions to stabilize.
   *
   * @param nodes - Rendered nodes to track for initialization
   * @param edges - Rendered edges to track for initialization
   * @param onComplete - Optional callback to execute after initialization completes
   */
  start(nodes: Node[], edges: Edge[], onComplete?: () => void | Promise<void>) {
    this.renderedNodeCount = nodes.length;
    this.onCompleteCallback = onComplete;

    const hasNodes = nodes.length > 0;
    const hasEdges = edges.length > 0;

    this.portStabilityDetector = new StabilityDetector(hasNodes, STABILITY_DELAY);
    this.labelStabilityDetector = new StabilityDetector(hasEdges, STABILITY_DELAY);

    this.initState.collectAlreadyMeasuredItems(nodes, edges);

    Promise.all([this.portStabilityDetector.waitForStability(), this.labelStabilityDetector.waitForStability()])
      .then(() => {
        this.entitiesStabilized = true;
        this.startMeasurementTimeout();
        this.tryFinish();
      })
      .catch((err) => {
        console.error(INIT_STABILIZATION_FAILED_ERROR(err));
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
   * Deletes a port during initialization.
   * Queues if finishing, otherwise delegates to internal updater since deletions
   * during initialization are rare and don't need to be batched in init state.
   *
   * @param nodeId - The node ID the port belongs to
   * @param portId - The port ID to delete
   */
  deletePort(nodeId: string, portId: string): void {
    if (this.lateArrivalQueue.isFinishing) {
      this.lateArrivalQueue.enqueue({ method: 'deletePort', args: [nodeId, portId] });
      return;
    }

    // During initialization, deletions are rare - delegate directly to internal updater
    this.flowCore.internalUpdater.deletePort(nodeId, portId);
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
   * Conditions: not already finishing, not initialized, entities stabilized, all rendered entities measured.
   */
  private tryFinish() {
    if (this.lateArrivalQueue.isFinishing || this.isInitialized) {
      return;
    }

    if (!this.entitiesStabilized) {
      return;
    }

    if (this.initState.allEntitiesHaveMeasurements(this.renderedNodeCount)) {
      this.finish();
    }
  }

  /**
   * Completes initialization by applying all collected data.
   * Marks as finishing, applies state, executes callback, marks as initialized, processes late arrivals.
   */
  private async finish() {
    this.clearMeasurementTimeout();
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

  /**
   * Starts a safety timeout to prevent indefinite waiting for measurements.
   * If measurements don't arrive within MEASUREMENT_TIMEOUT, initialization is forced to complete.
   * This handles cases where entities may not be measurable (e.g., display: none).
   */
  private startMeasurementTimeout(): void {
    this.measurementTimeout = setTimeout(() => {
      if (!this.isInitialized) {
        const nodeCount = this.getNodeCount();
        const expectedPorts = this.initState.portsToMeasure.size;
        const measuredPorts = this.initState.measuredPorts.size;
        const expectedLabels = this.initState.labelsToMeasure.size;
        const measuredLabels = this.initState.measuredLabels.size;
        const measuredNodes = this.initState.measuredNodes.size;

        console.warn(
          '[InitUpdater] Measurement timeout reached. Some entities may not be measurable (e.g., display: none).',
          {
            nodes: { expected: nodeCount, measured: measuredNodes },
            ports: { expected: expectedPorts, measured: measuredPorts },
            labels: { expected: expectedLabels, measured: measuredLabels },
          }
        );

        this.forceFinish();
      }
    }, MEASUREMENT_TIMEOUT);
  }

  /**
   * Clears the measurement timeout if it's active.
   */
  private clearMeasurementTimeout(): void {
    if (this.measurementTimeout !== null) {
      clearTimeout(this.measurementTimeout);
      this.measurementTimeout = null;
    }
  }

  private getNodeCount() {
    const { nodes, edges, metadata } = this.flowCore.getState();
    const result = this.flowCore.renderStrategy.process(nodes, edges, metadata.viewport);
    return result.nodes.length;
  }
}
