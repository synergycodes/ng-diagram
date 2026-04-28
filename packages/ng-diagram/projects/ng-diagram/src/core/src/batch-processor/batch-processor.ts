type FlushCallback<T> = (all: Map<string, T[]>) => void | Promise<void>;

interface PendingEntry<T> {
  items: T[];
  onFlush: FlushCallback<T>;
}

/**
 * Returns the set of item IDs that are already measured for a given key.
 * Used at flush time to filter out redundant adds (e.g. virtualization re-mounts
 * a component for an item that was never deleted from the model).
 * Called once per key, not per item — allows the implementation to build a
 * lookup structure (Map/Set) once and amortize across all items.
 */
type GetMeasuredIdsFn = (key: string) => Set<string>;

/**
 * Generic batch processor that collects operations (add, update, delete) within
 * the same JavaScript tick and flushes them together in a single microtask.
 *
 * Before flushing, two deduplication strategies are applied:
 * 1. **Intent cancellation**: matching add+delete pairs for the same item ID are
 *    removed from both queues (e.g. type change destroys and recreates a port
 *    with the same ID in the same tick).
 * 2. **Measurement filtering**: remaining adds with no matching delete are checked
 *    via `getMeasuredIds`. If the item is already measured, the add is dropped
 *    (e.g. virtualization re-mounts a component for a port that was never deleted
 *    from the model).
 *
 * Remaining operations are flushed sequentially in order: adds → updates → deletes.
 * Each operation is awaited before the next begins, ensuring that later
 * operations read fresh state left by earlier ones.
 *
 * Callbacks are stored per-key, so different callers can safely use the same
 * BatchProcessor instance with different flush targets.
 *
 * @typeParam TAdd - Type of items being added (must have an `id` property)
 * @typeParam TUpdate - Type of update descriptors
 */
export class BatchProcessor<TAdd extends { id: string }, TUpdate> {
  private readonly pendingAdds = new Map<string, PendingEntry<TAdd>>();
  private readonly pendingUpdates = new Map<string, PendingEntry<TUpdate>>();
  private readonly pendingDeletes = new Map<string, PendingEntry<string>>();

  private flushScheduled = false;

  constructor(private readonly getMeasuredIds?: GetMeasuredIdsFn) {}

  processAdd(key: string, item: TAdd, onFlush: FlushCallback<TAdd>): void {
    this.getOrCreate(this.pendingAdds, key, onFlush).items.push(item);
    this.scheduleFlush();
  }

  processUpdate(key: string, update: TUpdate, onFlush: FlushCallback<TUpdate>): void {
    this.getOrCreate(this.pendingUpdates, key, onFlush).items.push(update);
    this.scheduleFlush();
  }

  processDelete(key: string, itemId: string, onFlush: FlushCallback<string>): void {
    this.getOrCreate(this.pendingDeletes, key, onFlush).items.push(itemId);
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
   * then filters out redundant adds for items that are already measured,
   * then executes remaining operations sequentially: adds → updates → deletes.
   * Each callback is awaited before the next to prevent read-modify-write races.
   */
  private async flush(): Promise<void> {
    this.cancelMatchingIntents();
    this.filterAlreadyMeasuredAdds();

    const allAdds = this.takeAll(this.pendingAdds);
    const allUpdates = this.takeAll(this.pendingUpdates);
    const allDeletes = this.takeAll(this.pendingDeletes);

    this.flushScheduled = false;

    await this.invokeCallbacks(allAdds);
    await this.invokeCallbacks(allUpdates);
    await this.invokeCallbacks(allDeletes);
  }

  /**
   * Groups entries by callback reference and invokes each callback once
   * with all its keys collected into a single Map.
   */
  private async invokeCallbacks<T>(entries: Map<string, PendingEntry<T>>): Promise<void> {
    if (entries.size === 0) return;

    const byCallback = new Map<FlushCallback<T>, Map<string, T[]>>();

    for (const [key, { items, onFlush }] of entries) {
      let map = byCallback.get(onFlush);
      if (!map) {
        map = new Map();
        byCallback.set(onFlush, map);
      }
      map.set(key, items);
    }

    for (const [callback, data] of byCallback) {
      await callback(data);
    }
  }

  /**
   * Cancels out items that appear in both pendingAdds and pendingDeletes for the same key.
   * This prevents scenarios where an add+delete (or delete+add) in the same tick
   * produces counter-intuitive results due to flush ordering.
   */
  private cancelMatchingIntents(): void {
    for (const [key, deleteEntry] of this.pendingDeletes) {
      const addEntry = this.pendingAdds.get(key);
      if (!addEntry) continue;

      const deleteIdSet = new Set(deleteEntry.items);

      const filteredAdds = addEntry.items.filter((item) => {
        if (deleteIdSet.has(item.id)) {
          deleteIdSet.delete(item.id);
          return false;
        }
        return true;
      });

      if (filteredAdds.length === addEntry.items.length) continue;

      if (filteredAdds.length === 0) {
        this.pendingAdds.delete(key);
      } else {
        addEntry.items = filteredAdds;
      }

      if (deleteIdSet.size === 0) {
        this.pendingDeletes.delete(key);
      } else {
        deleteEntry.items = [...deleteIdSet];
      }
    }
  }

  /**
   * Filters out adds for items that are already measured and have no matching delete.
   * This runs after cancelMatchingIntents, so any remaining add without a delete
   * is an "orphaned" add — typically from virtualization re-mounting a component
   * for an item that was never removed from the model.
   */
  private filterAlreadyMeasuredAdds(): void {
    if (!this.getMeasuredIds) return;

    for (const [key, addEntry] of this.pendingAdds) {
      const measuredIds = this.getMeasuredIds(key);
      if (measuredIds.size === 0) continue;

      const filteredAdds = addEntry.items.filter((item) => !measuredIds.has(item.id));

      if (filteredAdds.length === addEntry.items.length) continue;

      if (filteredAdds.length === 0) {
        this.pendingAdds.delete(key);
      } else {
        addEntry.items = filteredAdds;
      }
    }
  }

  private getOrCreate<T>(map: Map<string, PendingEntry<T>>, key: string, onFlush: FlushCallback<T>): PendingEntry<T> {
    let entry = map.get(key);
    if (!entry) {
      entry = { items: [], onFlush };
      map.set(key, entry);
    }
    return entry;
  }

  private takeAll<T>(map: Map<string, PendingEntry<T>>): Map<string, PendingEntry<T>> {
    const all = new Map(map);
    map.clear();
    return all;
  }
}
