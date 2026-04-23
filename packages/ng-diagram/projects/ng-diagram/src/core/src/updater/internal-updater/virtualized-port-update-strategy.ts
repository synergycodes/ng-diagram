import type { FlowCore } from '../../flow-core';
import type { PortUpdate } from '../../port-batch-processor/port-batch-processor';
import type { Port } from '../../types';
import type { PortUpdateStrategy } from './port-update-strategy.interface';

/**
 * Virtualized port update strategy - uses global batching.
 * Used when virtualization is enabled for better performance with many nodes.
 */
export class VirtualizedPortUpdateStrategy implements PortUpdateStrategy {
  constructor(private readonly flowCore: FlowCore) {}

  addPort(nodeId: string, port: Port): void {
    if (this.isPortAlreadyMeasured(nodeId, port.id)) {
      return;
    }

    this.flowCore.portBatchProcessor.processAddBatched(nodeId, port, (allAdditions) => {
      this.flowCore.commandHandler.emit('addPortsBulk', { additions: allAdditions });
    });
  }

  updatePorts(nodeId: string, portUpdates: PortUpdate[]): void {
    for (const portUpdate of portUpdates) {
      this.flowCore.portBatchProcessor.processUpdateBatched(nodeId, portUpdate, (allUpdates) => {
        this.flowCore.commandHandler.emit('updatePortsBulk', { updates: allUpdates });
      });
    }
  }

  deletePort(nodeId: string, portId: string): void {
    this.flowCore.portBatchProcessor.processDeleteBatched(nodeId, portId, (allDeletions) => {
      this.flowCore.commandHandler.emit('deletePortsBulk', { deletions: allDeletions });
    });
  }

  private isPortAlreadyMeasured(nodeId: string, portId: string): boolean {
    const node = this.flowCore.getNodeById(nodeId);
    const existingPort = node?.measuredPorts?.find((p) => p.id === portId);
    return !!(existingPort?.size && existingPort?.position);
  }
}
