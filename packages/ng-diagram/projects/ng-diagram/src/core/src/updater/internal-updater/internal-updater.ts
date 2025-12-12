import { FlowCore } from '../../flow-core';
import type { Node, Port } from '../../types';
import { EdgeLabel } from '../../types';
import { getRect, isSameRect } from '../../utils';
import { Updater } from '../updater.interface';

export class InternalUpdater implements Updater {
  constructor(private readonly flowCore: FlowCore) {}

  /**
   * @internal
   * Internal method to initialize a node size
   * @param nodeId Node id
   * @param size Size
   */
  applyNodeSize(nodeId: string, size: NonNullable<Node['size']>): void {
    const node = this.flowCore.getNodeById(nodeId);

    // If the node size is the same the ports should be the same too
    if (!node || isSameRect(getRect(node), getRect({ size })) || this.flowCore.actionStateManager.isResizing()) {
      return;
    }

    this.flowCore.commandHandler.emit('resizeNode', {
      id: nodeId,
      size,
    });
  }

  /**
   * @internal
   * Internal method to add a new port to the flow
   * @param nodeId Node id
   * @param port Port
   */
  addPort(nodeId: string, port: Port): void {
    if (this.flowCore.config.virtualization.enabled) {
      // VIRTUALIZATION MODE: skip if port already has measurements (node re-entered viewport)
      const node = this.flowCore.getNodeById(nodeId);
      const existingPort = node?.measuredPorts?.find((p) => p.id === port.id);
      if (existingPort?.size && existingPort?.position) {
        return; // Port already measured, skip redundant add
      }
      // Port not measured yet, proceed with batched add for performance
      this.flowCore.portBatchProcessor.processAddBatched(nodeId, port, (allAdditions) => {
        this.flowCore.commandHandler.emit('addPortsBulk', { additions: allAdditions });
      });
    } else {
      // STANDARD MODE: original behavior - per-node batching within same tick
      this.flowCore.portBatchProcessor.processAdd(nodeId, port, (nodeId, ports) => {
        this.flowCore.commandHandler.emit('addPorts', { nodeId, ports });
      });
    }
  }

  /**
   * @internal
   * Internal method to delete a port from the flow
   * @param nodeId Node id
   * @param portId Port id
   */
  deletePort(nodeId: string, portId: string): void {
    if (this.flowCore.config.virtualization.enabled) {
      // VIRTUALIZATION MODE: skip delete - ports persist in model, only DOM unmounts
      return;
    } else {
      // STANDARD MODE: original behavior - single command per port
      this.flowCore.commandHandler.emit('deletePorts', { nodeId, portIds: [portId] });
    }
  }

  /**
   * @internal
   * Internal method to apply a port size and position
   * @param nodeId Node id
   * @param ports Ports with size and position
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

    if (this.flowCore.config.virtualization.enabled) {
      // VIRTUALIZATION MODE: batched updates for performance
      portsToUpdate.forEach(({ id, size, position }) => {
        this.flowCore.portBatchProcessor.processUpdateBatched(
          nodeId,
          { portId: id, portChanges: { size, position } },
          (allUpdates) => {
            this.flowCore.commandHandler.emit('updatePortsBulk', { updates: allUpdates });
          }
        );
      });
    } else {
      // STANDARD MODE: original behavior - per-node batching within same tick
      portsToUpdate.forEach(({ id, size, position }) => {
        this.flowCore.portBatchProcessor.processUpdate(
          nodeId,
          { portId: id, portChanges: { size, position } },
          (nodeId, portUpdates) => {
            this.flowCore.commandHandler.emit('updatePorts', { nodeId, ports: portUpdates });
          }
        );
      });
    }
  }

  /**
   * @internal
   * Internal method to add a new edge label to the flow
   * @param edgeId Edge id
   * @param label Label
   */
  addEdgeLabel(edgeId: string, label: EdgeLabel): void {
    this.flowCore.labelBatchProcessor.processAdd(edgeId, label, (edgeId, labels) => {
      this.flowCore.commandHandler.emit('addEdgeLabels', { edgeId, labels });
    });
  }

  /**
   * @internal
   * Internal method to apply an edge label size
   * @param edgeId Edge id
   * @param labelId Label id
   * @param size Size
   */
  applyEdgeLabelSize(edgeId: string, labelId: string, size: NonNullable<EdgeLabel['size']>): void {
    const edge = this.flowCore.getEdgeById(edgeId);
    const label = edge?.measuredLabels?.find((label) => label.id === labelId);

    if (!label || isSameRect(getRect({ size: label.size }), getRect({ size }))) {
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

  private getPortsToUpdate(node: Node, ports: NonNullable<Pick<Port, 'id' | 'size' | 'position'>>[]) {
    const allPortsMap = new Map<string, { size: Port['size']; position: Port['position'] }>();
    node?.measuredPorts?.forEach(({ id, size, position }) => allPortsMap.set(id, { size, position }));

    return ports.filter(({ id, size, position }) => {
      const port = allPortsMap.get(id);

      return port && !isSameRect(getRect(port), getRect({ size, position }));
    });
  }
}
