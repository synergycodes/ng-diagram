import { FlowCore } from '../../flow-core';
import type { Node, Port } from '../../types';
import { EdgeLabel } from '../../types';
import { getRect, isSameRect } from '../../utils';
import { Updater } from '../updater.interface';

export class InternalUpdater implements Updater {
  constructor(private readonly flowCore: FlowCore) {}

  private get isVirtualizationEnabled(): boolean {
    return this.flowCore.config.virtualization.enabled;
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
    if (this.isVirtualizationEnabled) {
      this.addPortVirtualized(nodeId, port);
    } else {
      this.addPortStandard(nodeId, port);
    }
  }

  private addPortVirtualized(nodeId: string, port: Port): void {
    if (this.isPortAlreadyMeasured(nodeId, port.id)) {
      return;
    }

    this.flowCore.portBatchProcessor.processAddBatched(nodeId, port, (allAdditions) => {
      this.flowCore.commandHandler.emit('addPortsBulk', { additions: allAdditions });
    });
  }

  private addPortStandard(nodeId: string, port: Port): void {
    this.flowCore.portBatchProcessor.processAdd(nodeId, port, (nodeId, ports) => {
      this.flowCore.commandHandler.emit('addPorts', { nodeId, ports });
    });
  }

  private isPortAlreadyMeasured(nodeId: string, portId: string): boolean {
    const node = this.flowCore.getNodeById(nodeId);
    const existingPort = node?.measuredPorts?.find((p) => p.id === portId);
    return !!(existingPort?.size && existingPort?.position);
  }

  /**
   * @internal
   * Internal method to delete a port from the flow.
   * In virtualization mode, ports persist in model (only DOM unmounts).
   */
  deletePort(nodeId: string, portId: string): void {
    if (this.isVirtualizationEnabled) {
      return;
    }

    this.flowCore.commandHandler.emit('deletePorts', { nodeId, portIds: [portId] });
  }

  /**
   * @internal
   * Internal method to apply a port size and position
   */
  applyPortsSizesAndPositions(nodeId: string, ports: NonNullable<Pick<Port, 'id' | 'size' | 'position'>>[]): void {
    const node = this.flowCore.getNodeById(nodeId);
    if (!node) {
      return;
    }

    const portsToUpdate = this.getPortsToUpdate(node, ports);
    if (portsToUpdate.length === 0) {
      return;
    }

    if (this.isVirtualizationEnabled) {
      this.updatePortsVirtualized(nodeId, portsToUpdate);
    } else {
      this.updatePortsStandard(nodeId, portsToUpdate);
    }
  }

  private updatePortsVirtualized(nodeId: string, ports: Pick<Port, 'id' | 'size' | 'position'>[]): void {
    for (const { id, size, position } of ports) {
      this.flowCore.portBatchProcessor.processUpdateBatched(
        nodeId,
        { portId: id, portChanges: { size, position } },
        (allUpdates) => {
          this.flowCore.commandHandler.emit('updatePortsBulk', { updates: allUpdates });
        }
      );
    }
  }

  private updatePortsStandard(nodeId: string, ports: Pick<Port, 'id' | 'size' | 'position'>[]): void {
    for (const { id, size, position } of ports) {
      this.flowCore.portBatchProcessor.processUpdate(
        nodeId,
        { portId: id, portChanges: { size, position } },
        (nodeId, portUpdates) => {
          this.flowCore.commandHandler.emit('updatePorts', { nodeId, ports: portUpdates });
        }
      );
    }
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
   * Internal method to apply an edge label size
   */
  applyEdgeLabelSize(edgeId: string, labelId: string, size: NonNullable<EdgeLabel['size']>): void {
    const label = this.findEdgeLabel(edgeId, labelId);

    if (!label || this.hasSameLabelSize(label, size)) {
      return;
    }

    this.flowCore.labelBatchProcessor.processUpdate(
      edgeId,
      { labelId, labelChanges: { size } },
      (edgeId, labelUpdates) => {
        this.flowCore.commandHandler.emit('updateEdgeLabels', { edgeId, labelUpdates });
      }
    );
  }

  private findEdgeLabel(edgeId: string, labelId: string): EdgeLabel | undefined {
    const edge = this.flowCore.getEdgeById(edgeId);
    return edge?.measuredLabels?.find((label) => label.id === labelId);
  }

  private hasSameLabelSize(label: EdgeLabel, size: NonNullable<EdgeLabel['size']>): boolean {
    return isSameRect(getRect({ size: label.size }), getRect({ size }));
  }

  private getPortsToUpdate(
    node: Node,
    ports: Pick<Port, 'id' | 'size' | 'position'>[]
  ): Pick<Port, 'id' | 'size' | 'position'>[] {
    const measuredPortsMap = this.buildMeasuredPortsMap(node);

    return ports.filter((port) => this.hasPortChanged(port, measuredPortsMap));
  }

  private buildMeasuredPortsMap(node: Node): Map<string, { size: Port['size']; position: Port['position'] }> {
    const map = new Map<string, { size: Port['size']; position: Port['position'] }>();

    for (const { id, size, position } of node.measuredPorts ?? []) {
      map.set(id, { size, position });
    }

    return map;
  }

  private hasPortChanged(
    port: Pick<Port, 'id' | 'size' | 'position'>,
    measuredPortsMap: Map<string, { size: Port['size']; position: Port['position'] }>
  ): boolean {
    const measuredPort = measuredPortsMap.get(port.id);

    if (!measuredPort) {
      return false;
    }

    return !isSameRect(getRect(measuredPort), getRect({ size: port.size, position: port.position }));
  }
}
