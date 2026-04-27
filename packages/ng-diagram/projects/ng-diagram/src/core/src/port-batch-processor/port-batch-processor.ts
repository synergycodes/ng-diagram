import { BatchProcessor } from '../batch-processor/batch-processor';
import type { Node, Port } from '../types';
import { isValidPosition, isValidSize } from '../utils/measurement-validation';

export interface PortUpdate {
  portId: string;
  portChanges: Partial<Port>;
}

export const toPortUpdates = (ports: Pick<Port, 'id' | 'size' | 'position'>[]): PortUpdate[] =>
  ports.map(({ id, size, position }) => ({ portId: id, portChanges: { size, position } }));

export class PortBatchProcessor extends BatchProcessor<Port, PortUpdate> {
  constructor(getNodeById: (nodeId: string) => Node | null | undefined) {
    super((nodeId, portId) => {
      const port = getNodeById(nodeId)?.measuredPorts?.find((p) => p.id === portId);
      return !!port && isValidSize(port.size) && isValidPosition(port.position);
    });
  }
}
