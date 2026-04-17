export const DEFAULT_SAFETY_TIMEOUT = 2000;
export const DEFAULT_DEBOUNCE_TIMEOUT = 50;

/**
 * Tracks pending measurements and notifies when all measurements are complete.
 *
 * This class coordinates asynchronous DOM measurements (node sizes, port positions, labels, etc.)
 * with transaction completion.
 *
 * ## Timing Model
 *
 * 1. **`trackEntities()` is called**: Entities are registered and activity is signaled immediately
 *    (because the middleware already detected actual changes). A debounce timer starts, along with
 *    a safety timeout.
 *
 * 2. **Subsequent DOM measurement signals arrive**: Each signal resets the debounce timer.
 *
 * 3. **Debounce expires** (no signals for `debounceMs`): Measurements complete normally.
 *
 * 4. **Safety timeout fires** (total time exceeds `safetyTimeoutMs`): Measurements are
 *    force-completed with a warning. This catches genuine rendering stalls.
 *
 * @example
 * ```typescript
 * // Stage config and track entities that actually changed
 * tracker.setNextTrackingConfig(debounceMs, safetyTimeoutMs);
 * // ... middleware detects actual changes ...
 * tracker.trackEntities(['node:abc', 'edge:xyz']); // signals immediately, starts debounce
 *
 * // Subsequent DOM measurement signals reset the debounce
 * tracker.signalNodeMeasurement(nodeId);
 *
 * // Wait for all measurements to settle
 * await tracker.waitForMeasurements();
 * ```
 *
 * @internal
 */
export class MeasurementTracker {
  private trackedIds = new Set<string>();
  private debounceTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private safetyTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private waitingPromise: Promise<void> | null = null;
  private waitingResolve: (() => void) | null = null;

  private debounceMs = DEFAULT_DEBOUNCE_TIMEOUT;
  private safetyTimeoutMs = DEFAULT_SAFETY_TIMEOUT;

  private pendingConfig: { debounceMs: number; safetyTimeoutMs: number } | null = null;

  /**
   * Stages timeout configuration for the next middleware-driven tracking pass.
   *
   * @param debounceMs - Debounce duration in milliseconds
   * @param safetyTimeoutMs - Maximum time to wait before force-completing with a warning
   */
  setNextTrackingConfig(debounceMs?: number, safetyTimeoutMs?: number): void {
    this.pendingConfig = {
      debounceMs: debounceMs ?? DEFAULT_DEBOUNCE_TIMEOUT,
      safetyTimeoutMs: safetyTimeoutMs ?? DEFAULT_SAFETY_TIMEOUT,
    };
  }

  /**
   * Returns true if tracking has been requested via setNextTrackingConfig().
   * Used by the measurement-tracking middleware to decide whether to track entities.
   */
  isTrackingRequested(): boolean {
    return this.pendingConfig !== null;
  }

  /**
   * Tracks entities detected by the middleware as actually changed.
   * Consumes the pending config from setNextTrackingConfig().
   *
   * If entityIds is empty (full no-op), just clears the pending config.
   * Otherwise, adds IDs to trackedIds and immediately signals activity for each
   * (because the changes already happened in the middleware). This starts the
   * debounce timer. Subsequent DOM measurement signals will reset the debounce as needed.
   *
   * @param entityIds - Prefixed entity IDs (e.g. 'node:abc', 'edge:xyz')
   */
  trackEntities(entityIds: string[]): void {
    const config = this.pendingConfig;
    this.pendingConfig = null;

    if (entityIds.length === 0) return;

    if (config) {
      this.debounceMs = config.debounceMs;
      this.safetyTimeoutMs = config.safetyTimeoutMs;
    }

    for (const id of entityIds) {
      this.trackedIds.add(id);
    }

    if (!this.safetyTimeoutId) {
      this.safetyTimeoutId = setTimeout(() => {
        this.onSafetyTimeout();
      }, this.safetyTimeoutMs);
    }

    for (const id of entityIds) {
      this.signalActivity(id);
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

  private onSafetyTimeout(): void {
    this.safetyTimeoutId = null;
    const pendingIds = [...this.trackedIds];
    console.warn('[MeasurementTracker] Safety timeout reached. Measurements may not have completed.', {
      pendingEntities: pendingIds,
      timeoutMs: this.safetyTimeoutMs,
    });
    this.clear();
  }

  private signalActivity(id: string): void {
    if (!this.trackedIds.has(id)) return;

    if (this.debounceTimeoutId) {
      clearTimeout(this.debounceTimeoutId);
    }

    this.debounceTimeoutId = setTimeout(() => {
      this.clear();
    }, this.debounceMs);
  }

  private clear(): void {
    if (this.safetyTimeoutId) {
      clearTimeout(this.safetyTimeoutId);
      this.safetyTimeoutId = null;
    }
    if (this.debounceTimeoutId) {
      clearTimeout(this.debounceTimeoutId);
      this.debounceTimeoutId = null;
    }

    this.trackedIds.clear();

    if (this.waitingResolve) {
      this.waitingResolve();
      this.waitingResolve = null;
      this.waitingPromise = null;
    }
  }
}
