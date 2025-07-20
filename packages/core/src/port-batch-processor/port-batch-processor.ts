import type { Port } from '../types';

/**
 * Processes and batches port additions for nodes to prevent race conditions when multiple ports
 * are added simultaneously (e.g., during node initialization).
 *
 * This class collects ports that are added in the same JavaScript tick and
 * processes them together in a single batch, ensuring all ports are properly
 * persisted to the state.
 */
export class PortBatchProcessor {
  private readonly pendingPorts = new Map<string, Port[]>();
  private readonly scheduledFlushes = new Set<string>();

  /**
   * Processes a port for batching with the specified node.
   * If this is the first port for the node in the current tick,
   * schedules a flush to process all collected ports.
   *
   * @param nodeId - The ID of the node to process the port for
   * @param port - The port to process
   * @param onFlush - Callback function to execute with all batched ports
   */
  process(nodeId: string, port: Port, onFlush: (nodeId: string, ports: Port[]) => void): void {
    if (!this.pendingPorts.has(nodeId)) {
      this.pendingPorts.set(nodeId, []);
    }

    this.pendingPorts.get(nodeId)!.push(port);

    if (!this.scheduledFlushes.has(nodeId)) {
      this.scheduledFlushes.add(nodeId);

      queueMicrotask(() => {
        this.flushPorts(nodeId, onFlush);
      });
    }
  }

  private flushPorts(nodeId: string, onFlush: (nodeId: string, ports: Port[]) => void): void {
    const ports = this.pendingPorts.get(nodeId);
    if (!ports || ports.length === 0) {
      return;
    }

    onFlush(nodeId, ports);

    this.pendingPorts.delete(nodeId);
    this.scheduledFlushes.delete(nodeId);
  }
}
