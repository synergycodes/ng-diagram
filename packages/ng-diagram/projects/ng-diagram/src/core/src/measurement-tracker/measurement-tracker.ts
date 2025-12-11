/**
 * Entry for tracking a pending measurement with debounce logic.
 */
interface MeasurementEntry {
  /** Resolves the measurement promise */
  resolve: () => void;
  /** Debounce timer ID - starts after first activity, reset on subsequent activity */
  debounceTimeoutId: ReturnType<typeof setTimeout> | null;
  /** Max timeout timer ID - window to wait for first activity to arrive */
  maxTimeoutId: ReturnType<typeof setTimeout> | null;
  /** Debounce duration in milliseconds */
  debounceMs: number;
  /** Whether first activity has been received */
  hasReceivedActivity: boolean;
}

/**
 * Tracks pending measurements and notifies when all measurements are complete.
 *
 * This class coordinates asynchronous DOM measurements (node sizes, port positions, labels, etc.)
 * with transaction completion.
 *
 * ## Timing Model
 *
 * 1. **When tracking starts**: A `maxTimeout` window begins. This is the maximum time
 *    to wait for the first measurement activity to arrive.
 *
 * 2. **If no activity arrives before maxTimeout**: The measurement completes (nothing changed).
 *
 * 3. **When first activity arrives**: The `maxTimeout` is cancelled, and a `debounceTimeout`
 *    starts. This debounce ensures we wait for the DOM to settle.
 *
 * 4. **On subsequent activity**: The `debounceTimeout` resets.
 *
 * 5. **When debounceTimeout expires**: The measurement completes (DOM has settled).
 *
 * This model ensures:
 * - Fast completion when nothing changes (maxTimeout is short)
 * - Proper settling when changes occur (debounce waits for stability)
 * - No artificial cap on debounce duration
 *
 * @example
 * ```typescript
 * // Track a node measurement with 50ms debounce
 * tracker.trackMeasurement('node:n1', 50);
 *
 * // Middleware signals activity when size changes
 * tracker.signalMeasurementActivity('node:n1'); // Cancels maxTimeout, starts debounce
 *
 * // Wait for all measurements to settle
 * await tracker.waitForMeasurements();
 * ```
 *
 * @internal
 */
export class MeasurementTracker {
  private pending = new Map<string, MeasurementEntry>();
  private waitingPromise: Promise<void> | null = null;
  private waitingResolve: (() => void) | null = null;

  /** Default debounce timeout in milliseconds (used after first activity arrives) */
  private readonly defaultDebounceMs = 50;

  /** Maximum timeout in milliseconds - window to wait for first activity */
  private readonly maxTimeoutMs = 1000;

  /**
   * Registers an entity for measurement tracking.
   *
   * The measurement is considered pending until either:
   * 1. maxTimeout expires without any activity (nothing changed), OR
   * 2. Activity arrives, then debounceTimeout expires without new activity (DOM settled)
   *
   * @param id - Unique identifier for the measurement (e.g., 'node:n1', 'edge:e1')
   * @param debounceMs - Debounce duration in milliseconds (default: 50)
   * @param initialTimeoutMs - Initial timeout in milliseconds to wait for first activity (default: 1000)
   */
  trackMeasurement(id: string, debounceMs?: number, initialTimeoutMs?: number): void {
    if (this.pending.has(id)) {
      // Already tracking - update debounce if provided
      const entry = this.pending.get(id)!;
      if (debounceMs !== undefined) {
        entry.debounceMs = debounceMs;
      }
      return;
    }

    const effectiveDebounceMs = debounceMs ?? this.defaultDebounceMs;
    const effectiveInitialTimeoutMs = initialTimeoutMs ?? this.maxTimeoutMs;

    const entry: MeasurementEntry = {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      resolve: () => {},
      debounceTimeoutId: null,
      maxTimeoutId: null,
      debounceMs: effectiveDebounceMs,
      hasReceivedActivity: false,
    };

    // Create promise for this measurement
    new Promise<void>((resolve) => {
      entry.resolve = resolve;
    });

    // Start max timeout - window to wait for first activity
    // If no activity arrives within this window, complete immediately
    entry.maxTimeoutId = setTimeout(() => {
      this.completeMeasurement(id);
    }, effectiveInitialTimeoutMs);

    this.pending.set(id, entry);
  }

  /**
   * Registers multiple entities for measurement tracking.
   *
   * @param ids - Array of unique identifiers for the measurements
   * @param debounceMs - Debounce duration in milliseconds (default: 50)
   * @param initialTimeoutMs - Initial timeout in milliseconds to wait for first activity (default: 1000)
   */
  trackMeasurements(ids: string[], debounceMs?: number, initialTimeoutMs?: number): void {
    for (const id of ids) {
      this.trackMeasurement(id, debounceMs, initialTimeoutMs);
    }
  }

  /**
   * Signals that measurement activity occurred for an entity.
   *
   * On first activity: cancels maxTimeout and starts debounceTimeout.
   * On subsequent activity: resets debounceTimeout.
   *
   * @param id - Unique identifier for the measurement
   */
  signalMeasurementActivity(id: string): void {
    const entry = this.pending.get(id);
    if (!entry) return;

    // First activity - cancel max timeout and switch to debounce mode
    if (!entry.hasReceivedActivity) {
      entry.hasReceivedActivity = true;
      if (entry.maxTimeoutId) {
        clearTimeout(entry.maxTimeoutId);
        entry.maxTimeoutId = null;
      }
    }

    // Reset debounce timer
    if (entry.debounceTimeoutId) {
      clearTimeout(entry.debounceTimeoutId);
    }

    entry.debounceTimeoutId = setTimeout(() => {
      this.completeMeasurement(id);
    }, entry.debounceMs);
  }

  /**
   * Force-completes a measurement immediately.
   *
   * @param id - Unique identifier for the measurement
   */
  completeMeasurement(id: string): void {
    const entry = this.pending.get(id);
    if (!entry) return;

    // Clear timers
    if (entry.debounceTimeoutId) {
      clearTimeout(entry.debounceTimeoutId);
    }
    if (entry.maxTimeoutId) {
      clearTimeout(entry.maxTimeoutId);
    }

    // Resolve and remove
    entry.resolve();
    this.pending.delete(id);

    // Check if all done
    this.checkAndNotify();
  }

  /**
   * Force-completes multiple measurements immediately.
   *
   * @param ids - Array of unique identifiers for the measurements
   */
  completeMeasurements(ids: string[]): void {
    for (const id of ids) {
      this.completeMeasurement(id);
    }
  }

  /**
   * Returns true if there are pending measurements.
   */
  hasPendingMeasurements(): boolean {
    return this.pending.size > 0;
  }

  /**
   * Returns the number of pending measurements.
   */
  getPendingCount(): number {
    return this.pending.size;
  }

  /**
   * Returns a copy of the pending measurement IDs.
   */
  getPendingIds(): string[] {
    return [...this.pending.keys()];
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
   * Clears all pending measurements and resolves all waiting promises.
   * Use this to reset state or handle error scenarios.
   */
  clear(): void {
    // Clear all timers
    for (const entry of this.pending.values()) {
      if (entry.debounceTimeoutId) {
        clearTimeout(entry.debounceTimeoutId);
      }
      if (entry.maxTimeoutId) {
        clearTimeout(entry.maxTimeoutId);
      }
      entry.resolve();
    }

    this.pending.clear();
    this.notifyWaiting();
  }

  /**
   * Checks if all measurements are complete and notifies waiting promise.
   */
  private checkAndNotify(): void {
    if (!this.hasPendingMeasurements()) {
      this.notifyWaiting();
    }
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
