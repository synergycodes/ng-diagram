import { BatchProcessor } from '../batch-processor/batch-processor';
import type { Edge, EdgeLabel } from '../types';
import { isValidSize } from '../utils/measurement-validation';

export interface LabelUpdate {
  labelId: string;
  labelChanges: Partial<EdgeLabel>;
}

export class LabelBatchProcessor extends BatchProcessor<EdgeLabel, LabelUpdate> {
  constructor(getEdgeById: (edgeId: string) => Edge | null | undefined) {
    super((edgeId, labelId) => {
      const label = getEdgeById(edgeId)?.measuredLabels?.find((l) => l.id === labelId);
      return !!label && isValidSize(label.size);
    });
  }
}
