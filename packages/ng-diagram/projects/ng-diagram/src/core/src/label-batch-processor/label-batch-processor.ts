import type { EdgeLabel } from '../types';

export interface LabelUpdate {
  labelId: string;
  labelChanges: Partial<EdgeLabel>;
}

/**
 * Processes and batches edge label operations to prevent race conditions when multiple labels
 * are added or updated simultaneously (e.g., during edge initialization or rapid measurements).
 *
 * This class collects label operations that occur in the same JavaScript tick and
 * processes them together in a single batch, ensuring all labels are properly
 * persisted to the state without overwriting each other.
 */
export class LabelBatchProcessor {
  private readonly pendingLabelAdditions = new Map<string, EdgeLabel[]>();
  private readonly scheduledAdditionFlushes = new Set<string>();

  private readonly pendingLabelUpdates = new Map<string, LabelUpdate[]>();
  private readonly scheduledUpdateFlushes = new Set<string>();

  /**
   * Processes a label addition for batching with the specified edge.
   * If this is the first label addition for the edge in the current tick,
   * schedules a flush to process all collected labels.
   *
   * @param edgeId - The ID of the edge to add the label to
   * @param label - The label to add
   * @param onFlush - Callback function to execute with all batched labels
   */
  processAdd(edgeId: string, label: EdgeLabel, onFlush: (edgeId: string, labels: EdgeLabel[]) => void): void {
    if (!this.pendingLabelAdditions.has(edgeId)) {
      this.pendingLabelAdditions.set(edgeId, []);
    }

    this.pendingLabelAdditions.get(edgeId)!.push(label);

    if (!this.scheduledAdditionFlushes.has(edgeId)) {
      this.scheduledAdditionFlushes.add(edgeId);

      queueMicrotask(() => {
        this.flushLabelAdditions(edgeId, onFlush);
      });
    }
  }

  /**
   * Processes a label update for batching with the specified edge.
   * If this is the first label update for the edge in the current tick,
   * schedules a flush to process all collected label updates.
   *
   * @param edgeId - The ID of the edge containing the label
   * @param labelUpdate - The label update containing ID and changes
   * @param onFlush - Callback function to execute with all batched label updates
   */
  processUpdate(
    edgeId: string,
    labelUpdate: LabelUpdate,
    onFlush: (edgeId: string, labelUpdates: LabelUpdate[]) => void
  ): void {
    if (!this.pendingLabelUpdates.has(edgeId)) {
      this.pendingLabelUpdates.set(edgeId, []);
    }

    this.pendingLabelUpdates.get(edgeId)!.push(labelUpdate);

    if (!this.scheduledUpdateFlushes.has(edgeId)) {
      this.scheduledUpdateFlushes.add(edgeId);

      queueMicrotask(() => {
        this.flushLabelUpdates(edgeId, onFlush);
      });
    }
  }

  private flushLabelAdditions(edgeId: string, onFlush: (edgeId: string, labels: EdgeLabel[]) => void): void {
    const labels = this.pendingLabelAdditions.get(edgeId);
    if (!labels || labels.length === 0) {
      return;
    }

    onFlush(edgeId, labels);

    this.pendingLabelAdditions.delete(edgeId);
    this.scheduledAdditionFlushes.delete(edgeId);
  }

  private flushLabelUpdates(edgeId: string, onFlush: (edgeId: string, labelUpdates: LabelUpdate[]) => void): void {
    const labelUpdates = this.pendingLabelUpdates.get(edgeId);
    if (!labelUpdates || labelUpdates.length === 0) {
      return;
    }

    onFlush(edgeId, labelUpdates);

    this.pendingLabelUpdates.delete(edgeId);
    this.scheduledUpdateFlushes.delete(edgeId);
  }
}
