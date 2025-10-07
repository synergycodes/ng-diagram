import { FlowCore } from '../../flow-core';
import type { Node, Port } from '../../types';
import { EdgeLabel } from '../../types';
import { getRect, isSameRect } from '../../utils';
import { BaseUpdater } from '../base-updater';
import { Updater } from '../updater.interface';

export class InternalUpdater extends BaseUpdater implements Updater {
  constructor(private readonly flowCore: FlowCore) {
    super();
  }

  /**
   * @internal
   * Internal method to initialize a node size
   * @param nodeId Node id
   * @param size Size
   * @returns true if processed, false if skipped
   */
  applyNodeSize(nodeId: string, size: NonNullable<Node['size']>): boolean {
    const node = this.flowCore.getNodeById(nodeId);

    // If the node size is the same the ports should be the same too
    if (!node || isSameRect(getRect(node), getRect({ size })) || this.flowCore.actionStateManager.isResizing()) {
      return true; // Skipped but not an error
    }

    this.flowCore.commandHandler.emit('resizeNode', {
      id: nodeId,
      size,
    });
    return true;
  }

  /**
   * @internal
   * Internal method to add a new port to the flow
   * @param nodeId Node id
   * @param port Port
   * @returns true (always processes)
   */
  addPort(nodeId: string, port: Port): boolean {
    this.flowCore.portBatchProcessor.processAdd(nodeId, port, (nodeId, ports) => {
      this.flowCore.commandHandler.emit('addPorts', { nodeId, ports });
    });
    return true;
  }

  /**
   * @internal
   * Internal method to apply a port size and position
   * @param nodeId Node id
   * @param ports Ports with size and position
   * @returns true if processed, false if node doesn't exist
   */
  applyPortsSizesAndPositions(nodeId: string, ports: NonNullable<Pick<Port, 'id' | 'size' | 'position'>>[]): boolean {
    const node = this.flowCore.getNodeById(nodeId);

    if (!node) {
      return true; // Node doesn't exist, not a failure
    }

    const portsToUpdate = this.getPortsToUpdate(node, ports);

    portsToUpdate.forEach(({ id, size, position }) => {
      this.flowCore.portBatchProcessor.processUpdate(
        nodeId,
        { portId: id, portChanges: { size, position } },
        (nodeId, portUpdates) => {
          this.flowCore.commandHandler.emit('updatePorts', { nodeId, ports: portUpdates });
        }
      );
    });
    return true;
  }

  /**
   * @internal
   * Internal method to add a new edge label to the flow
   * @param edgeId Edge id
   * @param label Label
   * @returns true (always processes)
   */
  addEdgeLabel(edgeId: string, label: EdgeLabel): boolean {
    this.flowCore.labelBatchProcessor.processAdd(edgeId, label, (edgeId, labels) => {
      this.flowCore.commandHandler.emit('addEdgeLabels', { edgeId, labels });
    });
    return true;
  }

  /**
   * @internal
   * Internal method to apply an edge label size
   * @param edgeId Edge id
   * @param labelId Label id
   * @param size Size
   * @returns true if processed, false if skipped
   */
  applyEdgeLabelSize(edgeId: string, labelId: string, size: NonNullable<EdgeLabel['size']>): boolean {
    const edge = this.flowCore.getEdgeById(edgeId);
    const label = edge?.measuredLabels?.find((label) => label.id === labelId);

    if (!label || isSameRect(getRect({ size: label.size }), getRect({ size }))) {
      return true; // Skipped but not a failure
    }

    this.flowCore.labelBatchProcessor.processUpdate(
      edgeId,
      { labelId, labelChanges: { size } },
      (edgeId, labelUpdates) => {
        this.flowCore.commandHandler.emit('updateEdgeLabels', { edgeId, labelUpdates });
      }
    );
    return true;
  }
}
