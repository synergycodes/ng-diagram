import type { FlowCore } from '../../flow-core';
import type { PortUpdate } from '../../port-batch-processor/port-batch-processor';
import type { Port } from '../../types';
import type { PortUpdateStrategy } from './port-update-strategy.interface';

/**
 * Direct port update strategy - uses per-node batching.
 * Used when virtualization is disabled.
 */
export class DirectPortUpdateStrategy implements PortUpdateStrategy {
  constructor(private readonly flowCore: FlowCore) {}

  addPort(nodeId: string, port: Port): void {
    this.flowCore.portBatchProcessor.processAdd(nodeId, port, (nodeId, ports) => {
      this.flowCore.commandHandler.emit('addPorts', { nodeId, ports });
    });
  }

  updatePorts(nodeId: string, portUpdates: PortUpdate[]): void {
    for (const portUpdate of portUpdates) {
      this.flowCore.portBatchProcessor.processUpdate(nodeId, portUpdate, (nodeId, batchedUpdates) => {
        this.flowCore.commandHandler.emit('updatePorts', { nodeId, ports: batchedUpdates });
      });
    }
  }

  deletePort(nodeId: string, portId: string): void {
    this.flowCore.portBatchProcessor.processDelete(nodeId, portId, (nodeId, portIds) => {
      this.flowCore.commandHandler.emit('deletePorts', { nodeId, portIds });
    });
  }
}
