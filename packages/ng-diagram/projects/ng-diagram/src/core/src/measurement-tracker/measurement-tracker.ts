import type { FlowStateUpdate } from '../types';

export const DEFAULT_INITIAL_TIMEOUT = 2000;
export const DEFAULT_DEBOUNCE_TIMEOUT = 50;

/**
 * Tracks pending measurements and notifies when all measurements are complete.
 *
 * This class coordinates asynchronous DOM measurements (node sizes, port positions, labels, etc.)
 * with transaction completion.
 *
 * ## Timing Model
 *
 * 1. **When tracking starts**: An `initialTimeout` window begins. This is the maximum time
 *    to wait for the first measurement activity to arrive.
 *
 * 2. **If no activity arrives before initialTimeout**: The measurement completes (nothing changed).
 *
 * 3. **When first activity arrives**: The `initialTimeout` is cancelled, and a `debounceTimeout`
 *    starts. This debounce ensures we wait for the DOM to settle.
 *
 * 4. **On subsequent activity**: The `debounceTimeout` resets.
 *
 * 5. **When debounceTimeout expires**: The measurement completes (DOM has settled).
 *
 * @example
 * ```typescript
 * // Track entities from a state update
 * tracker.trackStateUpdate(stateUpdate);
 *
 * // Middleware signals activity when size changes
 * tracker.signalNodeActivity(nodeId); // Cancels initialTimeout, starts debounce
 *
 * // Wait for all measurements to settle
 * await tracker.waitForMeasurements();
 * ```
 *
 * @internal
 */
export class MeasurementTracker {
  private trackedIds = new Set<string>();
  private initialTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private debounceTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private hasReceivedActivity = false;
  private waitingPromise: Promise<void> | null = null;
  private waitingResolve: (() => void) | null = null;

  private debounceMs = DEFAULT_DEBOUNCE_TIMEOUT;
  private initialTimeoutMs = DEFAULT_INITIAL_TIMEOUT;

  /**
   * Tracks all entities from a state update for measurement completion.
   *
   * @param stateUpdate - The state update containing entities to track
   * @param debounceMs - Debounce duration in milliseconds (default: 50)
   * @param initialTimeoutMs - Initial timeout in milliseconds to wait for first activity (default: 2000)
   */
  trackStateUpdate(stateUpdate: FlowStateUpdate, debounceMs?: number, initialTimeoutMs?: number): void {
    this.debounceMs = debounceMs ?? DEFAULT_DEBOUNCE_TIMEOUT;
    this.initialTimeoutMs = initialTimeoutMs ?? DEFAULT_INITIAL_TIMEOUT;

    if (stateUpdate.nodesToAdd) {
      for (const node of stateUpdate.nodesToAdd) {
        this.trackedIds.add(`node:${node.id}`);
      }
    }
    if (stateUpdate.nodesToUpdate) {
      for (const update of stateUpdate.nodesToUpdate) {
        this.trackedIds.add(`node:${update.id}`);
      }
    }
    if (stateUpdate.edgesToAdd) {
      for (const edge of stateUpdate.edgesToAdd) {
        this.trackedIds.add(`edge:${edge.id}`);
      }
    }
    if (stateUpdate.edgesToUpdate) {
      for (const update of stateUpdate.edgesToUpdate) {
        this.trackedIds.add(`edge:${update.id}`);
      }
    }

    if (!this.initialTimeoutId && !this.hasReceivedActivity) {
      this.initialTimeoutId = setTimeout(() => {
        this.onInitialTimeout();
      }, this.initialTimeoutMs);
    }
  }

  /**
   * Signals that measurement activity occurred for a node.
   */
  signalNodeMeasurement(nodeId: string): void {
    this.signalActivity(`node:${nodeId}`);
  }

  /**
   * Signals that measurement activity occurred for an edge.
   */
  signalEdgeMeasurement(edgeId: string): void {
    this.signalActivity(`edge:${edgeId}`);
  }

  /**
   * Returns a promise that resolves when all currently pending measurements are complete.
   * If there are no pending measurements, resolves immediately.
   */
  waitForMeasurements(): Promise<void> {
    if (!this.hasPendingMeasurements()) {
      return Promise.resolve();
    }

    if (this.waitingPromise) {
      return this.waitingPromise;
    }

    this.waitingPromise = new Promise<void>((resolve) => {
      this.waitingResolve = resolve;
    });

    return this.waitingPromise;
  }

  hasPendingMeasurements(): boolean {
    return this.trackedIds.size > 0;
  }

  private onInitialTimeout(): void {
    const pendingIds = [...this.trackedIds];
    console.warn('[MeasurementTracker] Initial timeout reached. No measurement activity received.', {
      pendingEntities: pendingIds,
      timeoutMs: this.initialTimeoutMs,
    });
    this.clear();
  }

  private signalActivity(id: string): void {
    if (!this.trackedIds.has(id)) return;

    if (!this.hasReceivedActivity) {
      this.hasReceivedActivity = true;
      if (this.initialTimeoutId) {
        clearTimeout(this.initialTimeoutId);
        this.initialTimeoutId = null;
      }
    }

    if (this.debounceTimeoutId) {
      clearTimeout(this.debounceTimeoutId);
    }

    this.debounceTimeoutId = setTimeout(() => {
      this.clear();
    }, this.debounceMs);
  }

  private clear(): void {
    if (this.initialTimeoutId) {
      clearTimeout(this.initialTimeoutId);
      this.initialTimeoutId = null;
    }
    if (this.debounceTimeoutId) {
      clearTimeout(this.debounceTimeoutId);
      this.debounceTimeoutId = null;
    }

    this.trackedIds.clear();
    this.hasReceivedActivity = false;

    if (this.waitingResolve) {
      this.waitingResolve();
      this.waitingResolve = null;
      this.waitingPromise = null;
    }
  }
}
