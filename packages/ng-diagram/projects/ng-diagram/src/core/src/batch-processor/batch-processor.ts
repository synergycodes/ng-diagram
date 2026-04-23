type FlushCallback<T> = (all: Map<string, T[]>) => void | Promise<void>;

/**
 * Generic batch processor that collects operations (add, update, delete) within
 * the same JavaScript tick and flushes them together in a single microtask.
 *
 * Operations are flushed sequentially in order: deletes → updates → adds.
 * Each operation is awaited before the next begins, ensuring that later
 * operations read fresh state left by earlier ones.
 *
 * @typeParam TAdd - Type of items being added
 * @typeParam TUpdate - Type of update descriptors
 */
export class BatchProcessor<TAdd, TUpdate> {
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
   * Executes sequentially: deletes → updates → adds.
   * Each callback is awaited before the next to prevent read-modify-write races.
   */
  private async flush(): Promise<void> {
    const allDeletes = this.takeAll(this.pendingDeletes);
    const allUpdates = this.takeAll(this.pendingUpdates);
    const allAdds = this.takeAll(this.pendingAdds);

    const deleteCallback = this.deleteCallback;
    const updateCallback = this.updateCallback;
    const addCallback = this.addCallback;

    this.deleteCallback = null;
    this.updateCallback = null;
    this.addCallback = null;
    this.flushScheduled = false;

    if (allDeletes.size > 0 && deleteCallback) {
      await deleteCallback(allDeletes);
    }
    if (allUpdates.size > 0 && updateCallback) {
      await updateCallback(allUpdates);
    }
    if (allAdds.size > 0 && addCallback) {
      await addCallback(allAdds);
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
