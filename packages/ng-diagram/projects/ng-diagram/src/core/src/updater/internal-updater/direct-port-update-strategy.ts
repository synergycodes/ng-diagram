import type { FlowCore } from '../../flow-core';
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

  updatePorts(nodeId: string, ports: Pick<Port, 'id' | 'size' | 'position'>[]): void {
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
}
