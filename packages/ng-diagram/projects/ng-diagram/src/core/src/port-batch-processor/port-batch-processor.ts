import type { Port } from '../types';

export interface PortUpdate {
  portId: string;
  portChanges: Partial<Port>;
}

/**
 * Processes and batches port operations for nodes to prevent race conditions when multiple ports
 * are added or updated simultaneously (e.g., during node initialization or virtualization).
 *
 * This class collects port operations that occur in the same JavaScript tick and
 * processes them together in a single batch, ensuring all ports are properly
 * persisted to the state.
 *
 * Standard mode: Uses per-node batching (processAdd, processUpdate)
 * Virtualization mode: Uses global batching (processAddBatched, processUpdateBatched, processDeleteBatched)
 */
export class PortBatchProcessor {
  // ===== STANDARD MODE: Per-node batching =====
  private readonly pendingPortAdditions = new Map<string, Port[]>();
  private readonly scheduledAdditionFlushes = new Set<string>();

  private readonly pendingPortUpdates = new Map<string, PortUpdate[]>();
  private readonly scheduledUpdateFlushes = new Set<string>();

  // ===== VIRTUALIZATION MODE: Global batching =====
  private globalAdditionFlushScheduled = false;
  private globalUpdateFlushScheduled = false;
  private readonly pendingPortDeletions = new Map<string, string[]>();
  private globalDeletionFlushScheduled = false;

  // =============================================
  // STANDARD MODE METHODS (original behavior)
  // =============================================

  /**
   * Processes a port addition for batching with the specified node.
   * If this is the first port addition for the node in the current tick,
   * schedules a flush to process all collected ports.
   *
   * @param nodeId - The ID of the node to add the port to
   * @param port - The port to add
   * @param onFlush - Callback function to execute with all batched ports
   */
  processAdd(nodeId: string, port: Port, onFlush: (nodeId: string, ports: Port[]) => void): void {
    if (!this.pendingPortAdditions.has(nodeId)) {
      this.pendingPortAdditions.set(nodeId, []);
    }

    this.pendingPortAdditions.get(nodeId)!.push(port);

    if (!this.scheduledAdditionFlushes.has(nodeId)) {
      this.scheduledAdditionFlushes.add(nodeId);

      queueMicrotask(() => {
        this.flushPortAdditions(nodeId, onFlush);
      });
    }
  }

  /**
   * Processes a port update for batching with the specified node.
   * If this is the first port update for the node in the current tick,
   * schedules a flush to process all collected updates.
   *
   * @param nodeId - The ID of the node containing the port
   * @param portUpdate - The port update containing ID and changes
   * @param onFlush - Callback function to execute with all batched updates
   */
  processUpdate(
    nodeId: string,
    portUpdate: PortUpdate,
    onFlush: (nodeId: string, portUpdates: PortUpdate[]) => void
  ): void {
    if (!this.pendingPortUpdates.has(nodeId)) {
      this.pendingPortUpdates.set(nodeId, []);
    }

    this.pendingPortUpdates.get(nodeId)!.push(portUpdate);

    if (!this.scheduledUpdateFlushes.has(nodeId)) {
      this.scheduledUpdateFlushes.add(nodeId);

      queueMicrotask(() => {
        this.flushPortUpdates(nodeId, onFlush);
      });
    }
  }

  private flushPortAdditions(nodeId: string, onFlush: (nodeId: string, ports: Port[]) => void): void {
    const ports = this.pendingPortAdditions.get(nodeId);
    if (!ports || ports.length === 0) {
      return;
    }

    onFlush(nodeId, ports);

    this.pendingPortAdditions.delete(nodeId);
    this.scheduledAdditionFlushes.delete(nodeId);
  }

  private flushPortUpdates(nodeId: string, onFlush: (nodeId: string, portUpdates: PortUpdate[]) => void): void {
    const portUpdates = this.pendingPortUpdates.get(nodeId);
    if (!portUpdates || portUpdates.length === 0) {
      return;
    }

    onFlush(nodeId, portUpdates);

    this.pendingPortUpdates.delete(nodeId);
    this.scheduledUpdateFlushes.delete(nodeId);
  }

  // =============================================
  // VIRTUALIZATION MODE METHODS (global batching)
  // =============================================

  /**
   * Processes port additions using a global batch callback that receives all additions at once.
   * This is the preferred method for virtualization scenarios where many nodes
   * need port additions simultaneously.
   *
   * @param nodeId - The ID of the node to add the port to
   * @param port - The port to add
   * @param onBatchFlush - Callback that receives ALL pending additions across all nodes
   */
  processAddBatched(nodeId: string, port: Port, onBatchFlush: (additions: Map<string, Port[]>) => void): void {
    if (!this.pendingPortAdditions.has(nodeId)) {
      this.pendingPortAdditions.set(nodeId, []);
    }

    this.pendingPortAdditions.get(nodeId)!.push(port);

    if (!this.globalAdditionFlushScheduled) {
      this.globalAdditionFlushScheduled = true;

      queueMicrotask(() => {
        this.flushAllPortAdditionsBatched(onBatchFlush);
      });
    }
  }

  /**
   * Processes port updates using a global batch callback that receives all updates at once.
   * This is the preferred method for virtualization scenarios where many nodes
   * need port updates simultaneously.
   *
   * @param nodeId - The ID of the node containing the port
   * @param portUpdate - The port update containing ID and changes
   * @param onBatchFlush - Callback that receives ALL pending updates across all nodes
   */
  processUpdateBatched(
    nodeId: string,
    portUpdate: PortUpdate,
    onBatchFlush: (updates: Map<string, PortUpdate[]>) => void
  ): void {
    if (!this.pendingPortUpdates.has(nodeId)) {
      this.pendingPortUpdates.set(nodeId, []);
    }

    this.pendingPortUpdates.get(nodeId)!.push(portUpdate);

    if (!this.globalUpdateFlushScheduled) {
      this.globalUpdateFlushScheduled = true;

      queueMicrotask(() => {
        this.flushAllPortUpdatesBatched(onBatchFlush);
      });
    }
  }

  /**
   * Processes port deletions using a global batch callback that receives all deletions at once.
   * This is essential for virtualization scenarios where many nodes are destroyed simultaneously.
   *
   * @param nodeId - The ID of the node containing the port to delete
   * @param portId - The ID of the port to delete
   * @param onBatchFlush - Callback that receives ALL pending deletions across all nodes
   */
  processDeleteBatched(nodeId: string, portId: string, onBatchFlush: (deletions: Map<string, string[]>) => void): void {
    if (!this.pendingPortDeletions.has(nodeId)) {
      this.pendingPortDeletions.set(nodeId, []);
    }

    this.pendingPortDeletions.get(nodeId)!.push(portId);

    if (!this.globalDeletionFlushScheduled) {
      this.globalDeletionFlushScheduled = true;

      queueMicrotask(() => {
        this.flushAllPortDeletionsBatched(onBatchFlush);
      });
    }
  }

  private flushAllPortAdditionsBatched(onBatchFlush: (additions: Map<string, Port[]>) => void): void {
    if (this.pendingPortAdditions.size === 0) {
      this.globalAdditionFlushScheduled = false;
      return;
    }

    // Copy the pending additions before clearing
    const additions = new Map(this.pendingPortAdditions);

    // Clear state first to allow new batches to accumulate
    this.pendingPortAdditions.clear();
    this.scheduledAdditionFlushes.clear();
    this.globalAdditionFlushScheduled = false;

    // Execute the batch callback with all additions at once
    onBatchFlush(additions);
  }

  private flushAllPortUpdatesBatched(onBatchFlush: (updates: Map<string, PortUpdate[]>) => void): void {
    if (this.pendingPortUpdates.size === 0) {
      this.globalUpdateFlushScheduled = false;
      return;
    }

    // Copy the pending updates before clearing
    const updates = new Map(this.pendingPortUpdates);

    // Clear state first to allow new batches to accumulate
    this.pendingPortUpdates.clear();
    this.scheduledUpdateFlushes.clear();
    this.globalUpdateFlushScheduled = false;

    // Execute the batch callback with all updates at once
    onBatchFlush(updates);
  }

  private flushAllPortDeletionsBatched(onBatchFlush: (deletions: Map<string, string[]>) => void): void {
    if (this.pendingPortDeletions.size === 0) {
      this.globalDeletionFlushScheduled = false;
      return;
    }

    // Copy the pending deletions before clearing
    const deletions = new Map(this.pendingPortDeletions);

    // Clear state first to allow new batches to accumulate
    this.pendingPortDeletions.clear();
    this.globalDeletionFlushScheduled = false;

    // Execute the batch callback with all deletions at once
    onBatchFlush(deletions);
  }
}
