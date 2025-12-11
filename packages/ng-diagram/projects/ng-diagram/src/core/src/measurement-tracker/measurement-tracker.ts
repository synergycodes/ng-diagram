import type { FlowStateUpdate } from '../types';

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
 * tracker.signalActivity('node:n1'); // Cancels initialTimeout, starts debounce
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

  /** Current debounce timeout in milliseconds */
  private debounceMs = 50;

  /** Current initial timeout in milliseconds */
  private initialTimeoutMs = 2000;

  /** Default debounce timeout in milliseconds */
  private readonly defaultDebounceMs = 50;

  /** Default initial timeout in milliseconds */
  private readonly defaultInitialTimeoutMs = 2000;

  /**
   * Tracks all entities from a state update for measurement completion.
   *
   * @param stateUpdate - The state update containing entities to track
   * @param debounceMs - Debounce duration in milliseconds (default: 50)
   * @param initialTimeoutMs - Initial timeout in milliseconds to wait for first activity (default: 2000)
   */
  trackStateUpdate(stateUpdate: FlowStateUpdate, debounceMs?: number, initialTimeoutMs?: number): void {
    // Update timeouts if provided
    this.debounceMs = debounceMs ?? this.defaultDebounceMs;
    this.initialTimeoutMs = initialTimeoutMs ?? this.defaultInitialTimeoutMs;

    // Collect all entity IDs
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

    // Start initial timeout if not already running
    if (!this.initialTimeoutId && !this.hasReceivedActivity) {
      this.initialTimeoutId = setTimeout(() => {
        this.complete();
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

  private signalActivity(id: string): void {
    if (!this.trackedIds.has(id)) return;

    // First activity - cancel initial timeout
    if (!this.hasReceivedActivity) {
      this.hasReceivedActivity = true;
      if (this.initialTimeoutId) {
        clearTimeout(this.initialTimeoutId);
        this.initialTimeoutId = null;
      }
    }

    // Reset debounce timer
    if (this.debounceTimeoutId) {
      clearTimeout(this.debounceTimeoutId);
    }

    this.debounceTimeoutId = setTimeout(() => {
      this.complete();
    }, this.debounceMs);
  }

  /**
   * Returns a promise that resolves when all currently pending measurements are complete.
   * If there are no pending measurements, resolves immediately.
   */
  waitForMeasurements(): Promise<void> {
    if (!this.hasPendingMeasurements()) {
      return Promise.resolve();
    }

    // Reuse existing waiting promise if available
    if (this.waitingPromise) {
      return this.waitingPromise;
    }

    this.waitingPromise = new Promise<void>((resolve) => {
      this.waitingResolve = resolve;
    });

    return this.waitingPromise;
  }

  /**
   * Returns true if there are pending measurements.
   */
  hasPendingMeasurements(): boolean {
    return this.trackedIds.size > 0;
  }

  /**
   * Returns the number of pending measurements.
   */
  getPendingCount(): number {
    return this.trackedIds.size;
  }

  /**
   * Clears all pending measurements and resolves all waiting promises.
   * Use this to reset state or handle error scenarios.
   */
  clear(): void {
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
    this.notifyWaiting();
  }

  /**
   * Completes measurement tracking and notifies waiting promises.
   */
  private complete(): void {
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
    this.notifyWaiting();
  }

  /**
   * Resolves the waiting promise and clears it.
   */
  private notifyWaiting(): void {
    if (this.waitingResolve) {
      this.waitingResolve();
      this.waitingResolve = null;
      this.waitingPromise = null;
    }
  }
}
