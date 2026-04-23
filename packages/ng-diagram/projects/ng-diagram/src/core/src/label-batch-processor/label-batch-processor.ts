import { BatchProcessor } from '../batch-processor/batch-processor';
import type { EdgeLabel } from '../types';

export interface LabelUpdate {
  labelId: string;
  labelChanges: Partial<EdgeLabel>;
}

export class LabelBatchProcessor extends BatchProcessor<EdgeLabel, LabelUpdate> {}
