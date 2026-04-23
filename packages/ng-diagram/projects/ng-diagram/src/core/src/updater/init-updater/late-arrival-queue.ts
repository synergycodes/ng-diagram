import { EdgeLabel, Node, Port } from '../../types';
import type { PortUpdate } from '../../port-batch-processor/port-batch-processor';
import type { LabelUpdate } from '../../label-batch-processor/label-batch-processor';
import { Updater } from '../updater.interface';

/**
 * Discriminated union representing updater method calls that can be queued.
 * Used to preserve the exact method signature and arguments for replay.
 */
export type LateArrival =
  | { method: 'addPort'; args: [nodeId: string, port: Port] }
  | { method: 'addEdgeLabel'; args: [edgeId: string, label: EdgeLabel] }
  | { method: 'applyNodeSize'; args: [nodeId: string, size: NonNullable<Node['size']>] }
  | { method: 'applyPortChanges'; args: [nodeId: string, portUpdates: PortUpdate[]] }
  | { method: 'applyEdgeLabelChanges'; args: [edgeId: string, labelUpdates: LabelUpdate[]] };

/**
 * Queues late arrivals during initialization finish to prevent data loss.
 *
 * Purpose: Handle race conditions where updates arrive while finish() is executing.
 *
 * How it works:
 * - When finish() starts, startFinishing() is called to mark the queue as active
 * - Any updates that arrive during finish() are queued via enqueue()
 * - After initialization completes, processAll() replays queued updates
 * - This ensures no updates are lost during the async finish process
 */
export class LateArrivalQueue {
  /** Queued method calls waiting to be processed */
  private queue: LateArrival[] = [];

  /** Flag indicating whether finish() is in progress */
  private isProcessing = false;

  /**
   * Returns whether the queue is in finishing mode.
   * When true, incoming updates should be queued instead of processed immediately.
   */
  get isFinishing(): boolean {
    return this.isProcessing;
  }

  /** Returns the number of queued arrivals */
  get length(): number {
    return this.queue.length;
  }

  /**
   * Marks the start of the finishing phase.
   * After calling this, isFinishing will return true and updates will be queued.
   */
  startFinishing(): void {
    this.isProcessing = true;
  }

  /**
   * Adds an updater method call to the queue.
   * The call will be replayed later during processAll().
   *
   * @param arrival - The method call to queue (method name + arguments)
   */
  enqueue(arrival: LateArrival): void {
    this.queue.push(arrival);
  }

  /**
   * Processes all queued arrivals by replaying them on the provided updater.
   * Clears the queue after processing.
   *
   * @param updater - The updater to replay queued method calls on
   */
  processAll(updater: Updater): void {
    if (this.queue.length === 0) {
      return;
    }

    for (const lateArrival of this.queue) {
      switch (lateArrival.method) {
        case 'addPort':
          updater.addPort(...lateArrival.args);
          break;
        case 'addEdgeLabel':
          updater.addEdgeLabel(...lateArrival.args);
          break;
        case 'applyNodeSize':
          updater.applyNodeSize(...lateArrival.args);
          break;
        case 'applyPortChanges':
          updater.applyPortChanges(...lateArrival.args);
          break;
        case 'applyEdgeLabelChanges':
          updater.applyEdgeLabelChanges(...lateArrival.args);
          break;
      }
    }

    this.queue = [];
  }
}
