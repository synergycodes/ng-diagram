import type { FlowCore } from '../../flow-core';
import type { PortUpdate } from '../../port-batch-processor/port-batch-processor';
import type { Port } from '../../types';
import type { PortUpdateStrategy } from './port-update-strategy.interface';

/**
 * Direct port update strategy - used when virtualization is disabled.
 */
export class DirectPortUpdateStrategy implements PortUpdateStrategy {
  constructor(private readonly flowCore: FlowCore) {}

  addPort(nodeId: string, port: Port): void {
    this.flowCore.portBatchProcessor.processAdd(nodeId, port, (allAdditions) => {
      return this.flowCore.commandHandler.emit('addPortsBulk', { additions: allAdditions });
    });
  }

  updatePorts(nodeId: string, portUpdates: PortUpdate[]): void {
    for (const portUpdate of portUpdates) {
      this.flowCore.portBatchProcessor.processUpdate(nodeId, portUpdate, (allUpdates) => {
        return this.flowCore.commandHandler.emit('updatePortsBulk', { updates: allUpdates });
      });
    }
  }

  deletePort(nodeId: string, portId: string): void {
    this.flowCore.portBatchProcessor.processDelete(nodeId, portId, (allDeletions) => {
      return this.flowCore.commandHandler.emit('deletePortsBulk', { deletions: allDeletions });
    });
  }
}
