import { FlowCore } from '../../flow-core';
import type { LabelUpdate } from '../../label-batch-processor/label-batch-processor';
import type { PortUpdate } from '../../port-batch-processor/port-batch-processor';
import type { Node, Port } from '../../types';
import { EdgeLabel } from '../../types';
import { getRect, isSameRect, isSameSize } from '../../utils';
import { Updater } from '../updater.interface';

export class InternalUpdater implements Updater {
  // Stable callback references so BatchProcessor can group keys into a single invocation
  private readonly onPortAddsFlush = (all: Map<string, Port[]>) => {
    return this.flowCore.commandHandler.emit('addPortsBulk', { additions: all });
  };
  private readonly onPortUpdatesFlush = (all: Map<string, PortUpdate[]>) => {
    return this.flowCore.commandHandler.emit('updatePortsBulk', { updates: all });
  };
  private readonly onPortDeletesFlush = (all: Map<string, string[]>) => {
    return this.flowCore.commandHandler.emit('deletePortsBulk', { deletions: all });
  };
  private readonly onLabelAddsFlush = (all: Map<string, EdgeLabel[]>) => {
    return this.flowCore.commandHandler.emit('addEdgeLabelsBulk', { additions: all });
  };
  private readonly onLabelUpdatesFlush = (all: Map<string, LabelUpdate[]>) => {
    return this.flowCore.commandHandler.emit('updateEdgeLabelsBulk', { updates: all });
  };
  private readonly onLabelDeletesFlush = (all: Map<string, string[]>) => {
    return this.flowCore.commandHandler.emit('deleteEdgeLabelsBulk', { deletions: all });
  };

  constructor(private readonly flowCore: FlowCore) {}

  /**
   * @internal
   */
  applyNodeSize(nodeId: string, size: NonNullable<Node['size']>): void {
    this.applyNodeSizes([{ id: nodeId, size }]);
  }

  /**
   * @internal
   */
  applyNodeSizes(updates: { id: string; size: NonNullable<Node['size']> }[]): void {
    const isResizing = this.flowCore.actionStateManager.isResizing();

    const filtered = updates.filter(({ id, size }) => {
      const node = this.flowCore.getNodeById(id);
      if (!node) return false;
      // During active user resize, only accept initial sizes (nodes without size yet).
      // Size-changed nodes are suppressed — the resize action is the source of truth.
      if (node.size && isResizing) return false;
      return !isSameRect(getRect(node), getRect({ size }));
    });

    if (filtered.length > 0) {
      this.flowCore.commandHandler.emit('updateNodes', { nodes: filtered });
    }
  }

  /**
   * @internal
   */
  addPort(nodeId: string, port: Port): void {
    this.flowCore.portBatchProcessor.processAdd(nodeId, port, this.onPortAddsFlush);
  }

  /**
   * @internal
   */
  deletePort(nodeId: string, portId: string): void {
    this.flowCore.portBatchProcessor.processDelete(nodeId, portId, this.onPortDeletesFlush);
  }

  /**
   * @internal
   * Filters out updates where no property actually differs from current state.
   */
  applyPortChanges(nodeId: string, portUpdates: PortUpdate[]): void {
    const node = this.flowCore.getNodeById(nodeId);
    if (!node) {
      return;
    }

    const filteredUpdates = this.filterUnchangedPortUpdates(node, portUpdates);
    if (filteredUpdates.length === 0) {
      return;
    }

    for (const portUpdate of filteredUpdates) {
      this.flowCore.portBatchProcessor.processUpdate(nodeId, portUpdate, this.onPortUpdatesFlush);
    }
  }

  /**
   * @internal
   */
  addEdgeLabel(edgeId: string, label: EdgeLabel): void {
    this.flowCore.labelBatchProcessor.processAdd(edgeId, label, this.onLabelAddsFlush);
  }

  /**
   * @internal
   */
  deleteEdgeLabel(edgeId: string, labelId: string): void {
    this.flowCore.labelBatchProcessor.processDelete(edgeId, labelId, this.onLabelDeletesFlush);
  }

  /**
   * @internal
   * Filters out updates where no property actually differs from current state.
   */
  applyEdgeLabelChanges(edgeId: string, labelUpdates: LabelUpdate[]): void {
    const filteredUpdates = this.filterUnchangedLabelUpdates(edgeId, labelUpdates);
    if (filteredUpdates.length === 0) {
      return;
    }

    for (const labelUpdate of filteredUpdates) {
      this.flowCore.labelBatchProcessor.processUpdate(edgeId, labelUpdate, this.onLabelUpdatesFlush);
    }
  }

  /**
   * Filters out port updates where none of the changed properties actually differ from current state.
   * Uses exact equality for all comparisons (size, position, side, type).
   */
  private filterUnchangedPortUpdates(node: Node, portUpdates: PortUpdate[]): PortUpdate[] {
    const measuredPortsMap = new Map((node.measuredPorts ?? []).map((port) => [port.id, port]));

    return portUpdates.filter(({ portId, portChanges }) => {
      const measuredPort = measuredPortsMap.get(portId);
      if (!measuredPort) {
        return false;
      }

      if (portChanges.side !== undefined && portChanges.side !== measuredPort.side) {
        return true;
      }

      if (portChanges.type !== undefined && portChanges.type !== measuredPort.type) {
        return true;
      }

      const hasGeometricChanges = 'size' in portChanges || 'position' in portChanges;
      if (hasGeometricChanges) {
        const newSize = portChanges.size ?? measuredPort.size;
        const newPosition = portChanges.position ?? measuredPort.position;

        if (!isSameRect(getRect(measuredPort), getRect({ size: newSize, position: newPosition }))) {
          return true;
        }
      }

      return false;
    });
  }

  /**
   * Filters out label updates where none of the changed properties actually differ from current state.
   * Uses exact equality for all comparisons (size, positionOnEdge).
   */
  private filterUnchangedLabelUpdates(edgeId: string, labelUpdates: LabelUpdate[]): LabelUpdate[] {
    const edge = this.flowCore.getEdgeById(edgeId);
    if (!edge) {
      return [];
    }

    const measuredLabelsMap = new Map((edge.measuredLabels ?? []).map((label) => [label.id, label]));

    return labelUpdates.filter(({ labelId, labelChanges }) => {
      const label = measuredLabelsMap.get(labelId);
      if (!label) {
        return false;
      }

      if (labelChanges.positionOnEdge !== undefined && labelChanges.positionOnEdge !== label.positionOnEdge) {
        return true;
      }

      if (labelChanges.size !== undefined) {
        if (!label.size) {
          return true;
        }

        if (!isSameSize(label.size, labelChanges.size)) {
          return true;
        }
      }

      return false;
    });
  }
}
