type FlushCallback<T> = (all: Map<string, T[]>) => void | Promise<void>;

/**
 * Generic batch processor that collects operations (add, update, delete) within
 * the same JavaScript tick and flushes them together in a single microtask.
 *
 * Before flushing, matching add+delete intents for the same item ID are cancelled
 * out (both removed), preventing stale state from surviving the tick.
 *
 * Remaining operations are flushed sequentially in order: adds → updates → deletes.
 * Each operation is awaited before the next begins, ensuring that later
 * operations read fresh state left by earlier ones.
 *
 * @typeParam TAdd - Type of items being added (must have an `id` property)
 * @typeParam TUpdate - Type of update descriptors
 */
export class BatchProcessor<TAdd extends { id: string }, TUpdate> {
  private readonly pendingAdds = new Map<string, TAdd[]>();
  private readonly pendingUpdates = new Map<string, TUpdate[]>();
  private readonly pendingDeletes = new Map<string, string[]>();

  private addCallback: FlushCallback<TAdd> | null = null;
  private updateCallback: FlushCallback<TUpdate> | null = null;
  private deleteCallback: FlushCallback<string> | null = null;

  private flushScheduled = false;

  processAdd(key: string, item: TAdd, onFlush: FlushCallback<TAdd>): void {
    this.getOrCreate(this.pendingAdds, key).push(item);
    this.addCallback = onFlush;
    this.scheduleFlush();
  }

  processUpdate(key: string, update: TUpdate, onFlush: FlushCallback<TUpdate>): void {
    this.getOrCreate(this.pendingUpdates, key).push(update);
    this.updateCallback = onFlush;
    this.scheduleFlush();
  }

  processDelete(key: string, itemId: string, onFlush: FlushCallback<string>): void {
    this.getOrCreate(this.pendingDeletes, key).push(itemId);
    this.deleteCallback = onFlush;
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (!this.flushScheduled) {
      this.flushScheduled = true;
      queueMicrotask(() => void this.flush());
    }
  }

  /**
   * Flushes all pending operations.
   * First cancels matching add+delete intents for the same item ID,
   * then executes remaining operations sequentially: adds → updates → deletes.
   * Each callback is awaited before the next to prevent read-modify-write races.
   */
  private async flush(): Promise<void> {
    this.cancelMatchingIntents();

    const allAdds = this.takeAll(this.pendingAdds);
    const allUpdates = this.takeAll(this.pendingUpdates);
    const allDeletes = this.takeAll(this.pendingDeletes);

    const addCallback = this.addCallback;
    const updateCallback = this.updateCallback;
    const deleteCallback = this.deleteCallback;

    this.addCallback = null;
    this.updateCallback = null;
    this.deleteCallback = null;
    this.flushScheduled = false;

    if (allAdds.size > 0 && addCallback) {
      await addCallback(allAdds);
    }
    if (allUpdates.size > 0 && updateCallback) {
      await updateCallback(allUpdates);
    }
    if (allDeletes.size > 0 && deleteCallback) {
      await deleteCallback(allDeletes);
    }
  }

  /**
   * Cancels out items that appear in both pendingAdds and pendingDeletes for the same key.
   * This prevents scenarios where an add+delete (or delete+add) in the same tick
   * produces counter-intuitive results due to flush ordering.
   */
  private cancelMatchingIntents(): void {
    for (const [key, deleteIds] of this.pendingDeletes) {
      const adds = this.pendingAdds.get(key);
      if (!adds) continue;

      const deleteIdSet = new Set(deleteIds);

      const filteredAdds = adds.filter((item) => {
        if (deleteIdSet.has(item.id)) {
          deleteIdSet.delete(item.id);
          return false;
        }
        return true;
      });

      if (filteredAdds.length === adds.length) continue;

      if (filteredAdds.length === 0) {
        this.pendingAdds.delete(key);
      } else {
        this.pendingAdds.set(key, filteredAdds);
      }

      if (deleteIdSet.size === 0) {
        this.pendingDeletes.delete(key);
      } else {
        this.pendingDeletes.set(key, [...deleteIdSet]);
      }
    }
  }

  private getOrCreate<T>(map: Map<string, T[]>, key: string): T[] {
    if (!map.has(key)) {
      map.set(key, []);
    }
    return map.get(key)!;
  }

  private takeAll<T>(map: Map<string, T[]>): Map<string, T[]> {
    const all = new Map(map);
    map.clear();
    return all;
  }
}
