import type { Port } from '../types';

export interface PortUpdate {
  portId: string;
  portChanges: Partial<Port>;
}

/**
 * Processes and batches port operations for nodes to prevent race conditions when multiple ports
 * are added or updated simultaneously (e.g., during node initialization).
 *
 * This class collects port operations that occur in the same JavaScript tick and
 * processes them together in a single batch, ensuring all ports are properly
 * persisted to the state.
 */
export class PortBatchProcessor {
  private readonly pendingPortAdditions = new Map<string, Port[]>();
  private readonly scheduledAdditionFlushes = new Set<string>();

  private readonly pendingPortUpdates = new Map<string, PortUpdate[]>();
  private readonly scheduledUpdateFlushes = new Set<string>();

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
}
