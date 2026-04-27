import { FlowCore } from '../../flow-core';
import type { LabelUpdate } from '../../label-batch-processor/label-batch-processor';
import type { PortUpdate } from '../../port-batch-processor/port-batch-processor';
import type { Node, Port } from '../../types';
import { EdgeLabel } from '../../types';
import { getRect, isSameRect } from '../../utils';
import { Updater } from '../updater.interface';

export class InternalUpdater implements Updater {
  constructor(private readonly flowCore: FlowCore) {}

  /**
   * @internal
   * Internal method to initialize a node size
   */
  applyNodeSize(nodeId: string, size: NonNullable<Node['size']>): void {
    const node = this.flowCore.getNodeById(nodeId);

    if (!node || this.isResizing() || this.hasSameSize(node, size)) {
      return;
    }

    this.flowCore.commandHandler.emit('resizeNode', { id: nodeId, size });
  }

  private isResizing(): boolean {
    return this.flowCore.actionStateManager.isResizing();
  }

  private hasSameSize(node: Node, size: NonNullable<Node['size']>): boolean {
    return isSameRect(getRect(node), getRect({ size }));
  }

  /**
   * @internal
   * Internal method to add a new port to the flow.
   * Skips ports that are already measured to prevent redundant adds
   * (e.g. when virtualization re-mounts a component for a port still in the model).
   */
  addPort(nodeId: string, port: Port): void {
    if (this.isPortAlreadyMeasured(nodeId, port.id)) {
      return;
    }

    this.flowCore.portBatchProcessor.processAdd(nodeId, port, (allAdditions) => {
      return this.flowCore.commandHandler.emit('addPortsBulk', { additions: allAdditions });
    });
  }

  /**
   * @internal
   * Internal method to delete a port from the flow
   */
  deletePort(nodeId: string, portId: string): void {
    this.flowCore.portBatchProcessor.processDelete(nodeId, portId, (allDeletions) => {
      return this.flowCore.commandHandler.emit('deletePortsBulk', { deletions: allDeletions });
    });
  }

  /**
   * @internal
   * Apply port changes (size, position, side, type, etc.) through the batch processor.
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
      this.flowCore.portBatchProcessor.processUpdate(nodeId, portUpdate, (allUpdates) => {
        return this.flowCore.commandHandler.emit('updatePortsBulk', { updates: allUpdates });
      });
    }
  }

  private isPortAlreadyMeasured(nodeId: string, portId: string): boolean {
    const node = this.flowCore.getNodeById(nodeId);
    const existingPort = node?.measuredPorts?.find((p) => p.id === portId);
    return !!(existingPort?.size && existingPort?.position);
  }

  /**
   * @internal
   * Internal method to add a new edge label to the flow
   */
  addEdgeLabel(edgeId: string, label: EdgeLabel): void {
    this.flowCore.labelBatchProcessor.processAdd(edgeId, label, (allAdditions) => {
      return this.flowCore.commandHandler.emit('addEdgeLabelsBulk', { additions: allAdditions });
    });
  }

  /**
   * @internal
   * Internal method to delete an edge label from the flow
   */
  deleteEdgeLabel(edgeId: string, labelId: string): void {
    this.flowCore.labelBatchProcessor.processDelete(edgeId, labelId, (allDeletions) => {
      return this.flowCore.commandHandler.emit('deleteEdgeLabelsBulk', { deletions: allDeletions });
    });
  }

  /**
   * @internal
   * Apply edge label changes (size, positionOnEdge, etc.) through the batch processor.
   * Filters out updates where no property actually differs from current state.
   */
  applyEdgeLabelChanges(edgeId: string, labelUpdates: LabelUpdate[]): void {
    const filteredUpdates = this.filterUnchangedLabelUpdates(edgeId, labelUpdates);
    if (filteredUpdates.length === 0) {
      return;
    }

    for (const labelUpdate of filteredUpdates) {
      this.flowCore.labelBatchProcessor.processUpdate(edgeId, labelUpdate, (allUpdates) => {
        return this.flowCore.commandHandler.emit('updateEdgeLabelsBulk', { updates: allUpdates });
      });
    }
  }

  /**
   * Filters out port updates where none of the changed properties actually differ from current state.
   * Uses 1px threshold for size/position, exact equality for side/type.
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
   * Uses 1px threshold for size, exact equality for positionOnEdge.
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

        if (!isSameRect(getRect({ size: label.size }), getRect({ size: labelChanges.size }))) {
          return true;
        }
      }

      return false;
    });
  }
}
