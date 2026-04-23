import { FlowCore } from '../../flow-core';
import type { LabelUpdate } from '../../label-batch-processor/label-batch-processor';
import type { PortUpdate } from '../../port-batch-processor/port-batch-processor';
import type { Node, Port } from '../../types';
import { EdgeLabel } from '../../types';
import { getRect, isSameRect } from '../../utils';
import { Updater } from '../updater.interface';
import { DirectPortUpdateStrategy } from './direct-port-update-strategy';
import type { PortUpdateStrategy } from './port-update-strategy.interface';
import { VirtualizedPortUpdateStrategy } from './virtualized-port-update-strategy';

export class InternalUpdater implements Updater {
  private readonly portUpdateStrategy: PortUpdateStrategy;

  constructor(private readonly flowCore: FlowCore) {
    this.portUpdateStrategy = this.flowCore.isVirtualizationActive
      ? new VirtualizedPortUpdateStrategy(flowCore)
      : new DirectPortUpdateStrategy(flowCore);
  }

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
   * Internal method to add a new port to the flow
   */
  addPort(nodeId: string, port: Port): void {
    this.portUpdateStrategy.addPort(nodeId, port);
  }

  /**
   * @internal
   * Internal method to delete a port from the flow
   */
  deletePort(nodeId: string, portId: string): void {
    this.portUpdateStrategy.deletePort(nodeId, portId);
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

    this.portUpdateStrategy.updatePorts(nodeId, filteredUpdates);
  }

  /**
   * @internal
   * Internal method to add a new edge label to the flow
   */
  addEdgeLabel(edgeId: string, label: EdgeLabel): void {
    this.flowCore.labelBatchProcessor.processAdd(edgeId, label, (edgeId, labels) => {
      this.flowCore.commandHandler.emit('addEdgeLabels', { edgeId, labels });
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
      this.flowCore.labelBatchProcessor.processUpdate(edgeId, labelUpdate, (edgeId, batchedUpdates) => {
        this.flowCore.commandHandler.emit('updateEdgeLabels', { edgeId, labelUpdates: batchedUpdates });
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

      if ('side' in portChanges && portChanges.side !== measuredPort.side) {
        return true;
      }

      if ('type' in portChanges && portChanges.type !== measuredPort.type) {
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

      if ('positionOnEdge' in labelChanges && labelChanges.positionOnEdge !== label.positionOnEdge) {
        return true;
      }

      if ('size' in labelChanges) {
        if (!label.size || !labelChanges.size) {
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
