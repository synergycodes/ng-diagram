import { FlowCore } from '../../flow-core';
import { EdgeLabel, Node, Point, Port, Size } from '../../types';
import { Updater } from '../updater.interface';
import { BatchInitializer } from './batch-initializer';

const STABILITY_DELAY = 50;

type LateArrival =
  | { method: 'addPort'; args: [nodeId: string, port: Port] }
  | { method: 'addEdgeLabel'; args: [edgeId: string, label: EdgeLabel] }
  | { method: 'applyNodeSize'; args: [nodeId: string, size: NonNullable<Node['size']>] }
  | {
      method: 'applyPortsSizesAndPositions';
      args: [nodeId: string, ports: NonNullable<Pick<Port, 'id' | 'size' | 'position'>>[]];
    }
  | { method: 'applyEdgeLabelSize'; args: [edgeId: string, labelId: string, size: Size] };

/**
 * InitUpdater batches all initialization data and applies it in a single state update.
 *
 * Strategy:
 * 1. Wait for entity creation to stabilize (addPort, addEdgeLabel) using BatchInitializers
 * 2. Immediately collect measurements (applyNodeSize, applyPortsSizesAndPositions, applyEdgeLabelSize)
 * 3. Finish when: entities stabilized AND all entities have measurements
 * 4. Apply everything in one setState
 * 5. Queue late arrivals to prevent data loss during finish transition
 */
export class InitUpdater implements Updater {
  public isInitialized = false;

  private portInitializer: BatchInitializer<Port>;
  private edgeLabelInitializer: BatchInitializer<EdgeLabel>;

  private nodeSizes = new Map<string, Size>();
  private portRects = new Map<string, { size: Size; position: Point }>();
  private edgeLabelSizes = new Map<string, Size>();

  private addedPorts = new Set<string>();
  private addedLabels = new Set<string>();

  private expectedPorts = new Set<string>();
  private expectedLabels = new Set<string>();

  private measuredNodes = new Set<string>();
  private measuredPorts = new Set<string>();
  private measuredLabels = new Set<string>();

  private entitiesStabilized = false;
  private onCompleteCallback?: () => void | Promise<void>;

  private lateArrivals: LateArrival[] = [];
  private isFinishing = false;

  constructor(private flowCore: FlowCore) {
    const state = flowCore.getState();
    const hasNodes = state.nodes.length > 0;
    const hasEdges = state.edges.length > 0;

    this.portInitializer = new BatchInitializer<Port>(hasNodes, STABILITY_DELAY);
    this.edgeLabelInitializer = new BatchInitializer<EdgeLabel>(hasEdges, STABILITY_DELAY);
  }

  start(onComplete?: () => void | Promise<void>) {
    this.onCompleteCallback = onComplete;

    // Pre-populate measured collections for entities that are already measured
    this.collectAlreadyMeasuredItems();

    Promise.all([this.portInitializer.waitForStability(), this.edgeLabelInitializer.waitForStability()])
      .then(() => {
        this.entitiesStabilized = true;
        console.log('[InitUpdater] Entities stabilized');
        this.tryFinish();
      })
      .catch((err) => {
        console.error('[InitUpdater] Entity stabilization failed:', err);
        this.forceFinish();
      });
  }

  applyNodeSize(nodeId: string, size: NonNullable<Node['size']>): void {
    if (this.isFinishing) {
      this.lateArrivals.push({ method: 'applyNodeSize', args: [nodeId, size] });
      return;
    }

    this.nodeSizes.set(nodeId, size);

    if ((size.width ?? 0) > 0 && (size.height ?? 0) > 0) {
      this.measuredNodes.add(nodeId);
    }

    this.tryFinish();
  }

  addPort(nodeId: string, port: Port): void {
    if (this.isFinishing) {
      this.lateArrivals.push({ method: 'addPort', args: [nodeId, port] });
      return;
    }

    const key = this.getCompoundId(nodeId, port.id);
    this.addedPorts.add(key);
    this.expectedPorts.add(key);
    this.portInitializer.add(key, port);
  }

  applyPortsSizesAndPositions(nodeId: string, ports: NonNullable<Pick<Port, 'id' | 'size' | 'position'>>[]): void {
    if (this.isFinishing) {
      this.lateArrivals.push({ method: 'applyPortsSizesAndPositions', args: [nodeId, ports] });
      return;
    }

    const node = this.flowCore.getNodeById(nodeId);
    if (!node) {
      return;
    }

    for (const { id, size, position } of ports) {
      if (!size || !position) continue;

      const key = this.getCompoundId(nodeId, id);
      this.portRects.set(key, { size, position });

      if ((size.width ?? 0) > 0 && (size.height ?? 0) > 0 && position.x != null && position.y != null) {
        this.measuredPorts.add(key);
      }
    }

    this.tryFinish();
  }

  addEdgeLabel(edgeId: string, label: EdgeLabel): void {
    if (this.isFinishing) {
      this.lateArrivals.push({ method: 'addEdgeLabel', args: [edgeId, label] });
      return;
    }

    const key = this.getCompoundId(edgeId, label.id);
    this.addedLabels.add(key);
    this.expectedLabels.add(key);
    this.edgeLabelInitializer.add(key, label);
  }

  applyEdgeLabelSize(edgeId: string, labelId: string, size: Size): void {
    if (this.isFinishing) {
      this.lateArrivals.push({ method: 'applyEdgeLabelSize', args: [edgeId, labelId, size] });
      return;
    }

    const key = this.getCompoundId(edgeId, labelId);
    this.edgeLabelSizes.set(key, size);

    if ((size.width ?? 0) > 0 && (size.height ?? 0) > 0) {
      this.measuredLabels.add(key);
    }

    this.tryFinish();
  }

  private collectAlreadyMeasuredItems() {
    const state = this.flowCore.getState();

    for (const node of state.nodes) {
      if ((node.size?.width ?? 0) > 0 && (node.size?.height ?? 0) > 0) {
        this.measuredNodes.add(node.id);
      }

      for (const port of node.measuredPorts ?? []) {
        const key = this.getCompoundId(node.id, port.id);
        this.expectedPorts.add(key);

        if (
          (port.size?.width ?? 0) > 0 &&
          (port.size?.height ?? 0) > 0 &&
          port.position?.x != null &&
          port.position?.y != null
        ) {
          this.measuredPorts.add(key);
        }
      }
    }

    for (const edge of state.edges) {
      for (const label of edge.measuredLabels ?? []) {
        const key = this.getCompoundId(edge.id, label.id);
        this.expectedLabels.add(key);

        if ((label.size?.width ?? 0) > 0 && (label.size?.height ?? 0) > 0) {
          this.measuredLabels.add(key);
        }
      }
    }
  }

  private tryFinish() {
    if (this.isFinishing || this.isInitialized) {
      return;
    }

    if (!this.entitiesStabilized) {
      return;
    }

    if (this.allEntitiesHaveMeasurements()) {
      this.finish();
    }
  }

  private allEntitiesHaveMeasurements(): boolean {
    const state = this.flowCore.getState();
    const nodeCount = state.nodes.length;

    const allNodesMeasured = this.measuredNodes.size === nodeCount;
    const allPortsMeasured = this.measuredPorts.size === this.expectedPorts.size;
    const allLabelsMeasured = this.measuredLabels.size === this.expectedLabels.size;

    return allNodesMeasured && allPortsMeasured && allLabelsMeasured;
  }

  private async finish() {
    this.isFinishing = true;

    this.applyAllData();

    if (this.onCompleteCallback) {
      await this.onCompleteCallback();
    }

    this.isInitialized = true;

    if (this.lateArrivals.length > 0) {
      console.log(`[InitUpdater] Processing ${this.lateArrivals.length} late arrivals`);
      console.log(this.lateArrivals);
      const internalUpdater = this.flowCore.internalUpdater;

      for (const lateArrival of this.lateArrivals) {
        switch (lateArrival.method) {
          case 'addPort':
            internalUpdater.addPort(...lateArrival.args);
            break;
          case 'addEdgeLabel':
            internalUpdater.addEdgeLabel(...lateArrival.args);
            break;
          case 'applyNodeSize':
            internalUpdater.applyNodeSize(...lateArrival.args);
            break;
          case 'applyPortsSizesAndPositions':
            internalUpdater.applyPortsSizesAndPositions(...lateArrival.args);
            break;
          case 'applyEdgeLabelSize':
            internalUpdater.applyEdgeLabelSize(...lateArrival.args);
            break;
        }
      }

      this.lateArrivals = [];
    }
  }

  private forceFinish() {
    this.finish();
  }

  private applyAllData() {
    const { nodes, edges, ...restState } = this.flowCore.getState();

    const portData = this.portInitializer.data;
    const labelData = this.edgeLabelInitializer.data;

    const nodePortsMap = new Map<string, Port[]>();
    for (const [key, port] of portData.entries()) {
      const { entityId: nodeId } = this.splitCompoundId(key);
      const nodePorts = nodePortsMap.get(nodeId) || [];
      nodePorts.push(port);
      nodePortsMap.set(nodeId, nodePorts);
    }

    const edgeLabelsMap = new Map<string, EdgeLabel[]>();
    for (const [key, label] of labelData.entries()) {
      const { entityId: edgeId } = this.splitCompoundId(key);
      const edgeLabels = edgeLabelsMap.get(edgeId) || [];
      edgeLabels.push(label);
      edgeLabelsMap.set(edgeId, edgeLabels);
    }

    const updatedNodes = nodes.map((node) => {
      const size = this.nodeSizes.get(node.id) || node.size;
      const newPorts = nodePortsMap.get(node.id);

      const portsById = new Map<string, Port>();

      if (node.measuredPorts) {
        for (const port of node.measuredPorts) {
          portsById.set(port.id, port);
        }
      }

      if (newPorts) {
        for (const port of newPorts) {
          portsById.set(port.id, port);
        }
      }

      let measuredPorts = portsById.size > 0 ? Array.from(portsById.values()) : undefined;

      if (measuredPorts) {
        measuredPorts = measuredPorts.map((port) => {
          const key = this.getCompoundId(node.id, port.id);
          const rect = this.portRects.get(key);

          if (!rect) return port;

          return {
            ...port,
            size: rect.size,
            position: rect.position,
          };
        });
      }

      return {
        ...node,
        size,
        measuredPorts,
      };
    });

    const updatedEdges = edges.map((edge) => {
      const newLabels = edgeLabelsMap.get(edge.id);

      const labelsById = new Map<string, EdgeLabel>();

      if (edge.measuredLabels) {
        for (const label of edge.measuredLabels) {
          labelsById.set(label.id, label);
        }
      }

      if (newLabels) {
        for (const label of newLabels) {
          labelsById.set(label.id, label);
        }
      }

      let measuredLabels = labelsById.size > 0 ? Array.from(labelsById.values()) : undefined;

      if (measuredLabels) {
        measuredLabels = measuredLabels.map((label) => {
          const key = this.getCompoundId(edge.id, label.id);
          const size = this.edgeLabelSizes.get(key);

          if (!size) return label;

          return { ...label, size };
        });
      }

      return {
        ...edge,
        measuredLabels,
      };
    });

    this.flowCore.setState({
      ...restState,
      nodes: updatedNodes,
      edges: updatedEdges,
    });
  }

  private splitCompoundId(id: string) {
    const [entityId, itemId] = id.split(ID_SEPARATOR);

    return {
      entityId,
      itemId,
    };
  }

  private getCompoundId(edgeId: string, labelId: string) {
    return `${edgeId}${ID_SEPARATOR}${labelId}`;
  }
}

const ID_SEPARATOR = '->';
