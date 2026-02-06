import type { Port } from '../types';

export interface PortUpdate {
  portId: string;
  portChanges: Partial<Port>;
}

/**
 * Generic batcher that supports both per-node and global batching patterns.
 */
class OperationBatcher<T> {
  private readonly pending = new Map<string, T[]>();
  private readonly scheduledPerNode = new Set<string>();
  private globalFlushScheduled = false;

  /**
   * Per-node batching: schedules a separate flush for each node.
   */
  addPerNode(nodeId: string, item: T, onFlush: (nodeId: string, items: T[]) => void): void {
    this.getOrCreateArray(nodeId).push(item);

    if (!this.scheduledPerNode.has(nodeId)) {
      this.scheduledPerNode.add(nodeId);
      queueMicrotask(() => this.flushPerNode(nodeId, onFlush));
    }
  }

  /**
   * Global batching: schedules a single flush for all nodes.
   */
  addGlobal(nodeId: string, item: T, onBatchFlush: (all: Map<string, T[]>) => void): void {
    this.getOrCreateArray(nodeId).push(item);

    if (!this.globalFlushScheduled) {
      this.globalFlushScheduled = true;
      queueMicrotask(() => this.flushGlobal(onBatchFlush));
    }
  }

  private getOrCreateArray(nodeId: string): T[] {
    if (!this.pending.has(nodeId)) {
      this.pending.set(nodeId, []);
    }
    return this.pending.get(nodeId)!;
  }

  private flushPerNode(nodeId: string, onFlush: (nodeId: string, items: T[]) => void): void {
    const items = this.pending.get(nodeId);
    if (!items || items.length === 0) {
      return;
    }

    onFlush(nodeId, items);

    this.pending.delete(nodeId);
    this.scheduledPerNode.delete(nodeId);
  }

  private flushGlobal(onBatchFlush: (all: Map<string, T[]>) => void): void {
    if (this.pending.size === 0) {
      this.globalFlushScheduled = false;
      return;
    }

    const all = new Map(this.pending);

    this.pending.clear();
    this.scheduledPerNode.clear();
    this.globalFlushScheduled = false;

    onBatchFlush(all);
  }
}

/**
 * Processes and batches port operations for nodes to prevent race conditions when multiple ports
 * are added or updated simultaneously (e.g., during node initialization or virtualization).
 *
 * This class collects port operations that occur in the same JavaScript tick and
 * processes them together in a single batch, ensuring all ports are properly
 * persisted to the state.
 *
 * Standard mode: Uses per-node batching (processAdd, processUpdate, processDelete)
 * Virtualization mode: Uses global batching (processAddBatched, processUpdateBatched, processDeleteBatched)
 */
export class PortBatchProcessor {
  private readonly additionBatcher = new OperationBatcher<Port>();
  private readonly updateBatcher = new OperationBatcher<PortUpdate>();
  private readonly deletionBatcher = new OperationBatcher<string>();

  // =============================================
  // STANDARD MODE METHODS (per-node batching)
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
    this.additionBatcher.addPerNode(nodeId, port, onFlush);
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
    this.updateBatcher.addPerNode(nodeId, portUpdate, onFlush);
  }

  /**
   * Processes a port deletion for batching with the specified node.
   * If this is the first port deletion for the node in the current tick,
   * schedules a flush to process all collected deletions.
   *
   * @param nodeId - The ID of the node containing the port
   * @param portId - The ID of the port to delete
   * @param onFlush - Callback function to execute with all batched port IDs
   */
  processDelete(nodeId: string, portId: string, onFlush: (nodeId: string, portIds: string[]) => void): void {
    this.deletionBatcher.addPerNode(nodeId, portId, onFlush);
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
    this.additionBatcher.addGlobal(nodeId, port, onBatchFlush);
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
    this.updateBatcher.addGlobal(nodeId, portUpdate, onBatchFlush);
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
    this.deletionBatcher.addGlobal(nodeId, portId, onBatchFlush);
  }
}
