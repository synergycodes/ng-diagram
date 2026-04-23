import type { Port } from '../types';

export interface PortUpdate {
  portId: string;
  portChanges: Partial<Port>;
}

type FlushCallback<T> = (all: Map<string, T[]>) => void | Promise<void>;

/**
 * Batches port operations (add, update, delete) that occur in the same JavaScript tick
 * and flushes them together. Operations are flushed sequentially in order:
 * deletes → updates → adds. Each operation is awaited before the next begins,
 * ensuring that later operations read fresh state left by earlier ones.
 */
export class PortBatchProcessor {
  private readonly pendingAdds = new Map<string, Port[]>();
  private readonly pendingUpdates = new Map<string, PortUpdate[]>();
  private readonly pendingDeletes = new Map<string, string[]>();

  private addCallback: FlushCallback<Port> | null = null;
  private updateCallback: FlushCallback<PortUpdate> | null = null;
  private deleteCallback: FlushCallback<string> | null = null;

  private flushScheduled = false;

  processAdd(nodeId: string, port: Port, onFlush: FlushCallback<Port>): void {
    this.getOrCreate(this.pendingAdds, nodeId).push(port);
    this.addCallback = onFlush;
    this.scheduleFlush();
  }

  processUpdate(nodeId: string, portUpdate: PortUpdate, onFlush: FlushCallback<PortUpdate>): void {
    this.getOrCreate(this.pendingUpdates, nodeId).push(portUpdate);
    this.updateCallback = onFlush;
    this.scheduleFlush();
  }

  processDelete(nodeId: string, portId: string, onFlush: FlushCallback<string>): void {
    this.getOrCreate(this.pendingDeletes, nodeId).push(portId);
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
   * Flushes all pending operations across all nodes.
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
