import { BatchProcessor } from '../batch-processor/batch-processor';
import type { Port } from '../types';

export interface PortUpdate {
  portId: string;
  portChanges: Partial<Port>;
}

export class PortBatchProcessor extends BatchProcessor<Port, PortUpdate> {}
