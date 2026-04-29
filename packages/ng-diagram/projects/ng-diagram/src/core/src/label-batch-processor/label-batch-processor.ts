import { BatchProcessor } from '../batch-processor/batch-processor';
import type { Edge, EdgeLabel } from '../types';
import { isValidSize } from '../utils/measurement-validation';

export interface LabelUpdate {
  labelId: string;
  labelChanges: Partial<EdgeLabel>;
}

export class LabelBatchProcessor extends BatchProcessor<EdgeLabel, LabelUpdate> {
  constructor(getEdgeById: (edgeId: string) => Edge | null | undefined) {
    super((edgeId) => {
      const labels = getEdgeById(edgeId)?.measuredLabels ?? [];
      const measured = new Set<string>();
      for (const label of labels) {
        if (isValidSize(label.size)) {
          measured.add(label.id);
        }
      }
      return measured;
    });
  }
}
