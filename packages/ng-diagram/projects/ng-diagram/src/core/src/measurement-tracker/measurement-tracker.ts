export const DEFAULT_DISCOVERY_WINDOW_TIMEOUT = 70;
export const DEFAULT_DEBOUNCE_TIMEOUT = 50;

/**
 * When a ResizeObserver fires during an active timer (discovery window or debounce)
 * and the remaining time is below this threshold, the timer is extended to its full
 * duration. This gives the double-RAF measurement pipeline (~32ms) enough time to deliver.
 */
export const OBSERVER_ACTIVITY_MIN_REMAINING = 40;

export interface MeasurementTrackingConfig {
  discoveryWindowMs?: number;
  debounceMs?: number;
}

type Phase = 'idle' | 'discoveryWindow' | 'debounce';

interface PhaseTimer {
  timeoutId: number | null;
  expiresAt: number;
  durationMs: number;
}

/**
 * Tracks pending measurements and notifies when all measurements are complete.
 *
 * This class coordinates asynchronous DOM measurements (node sizes, port positions, labels, etc.)
 * with transaction completion using a two-phase observation model.
 *
 * ## Timing Model
 *
 * ### Phase 1: Discovery Window
 * After `registerParticipants()` is called, a discovery window opens. The tracker waits
 * to see if any measurement activity occurs for the registered participant entities.
 *
 * - If a **measurement signal** arrives (via `signalMeasurement()`): transitions to Phase 2.
 * - If a **ResizeObserver early signal** arrives (via `signalObserverActivity()`):
 *   if remaining time is below `OBSERVER_ACTIVITY_MIN_REMAINING`, the timer resets
 *   to full `discoveryWindowMs`, giving the double-RAF pipeline time to deliver.
 * - If the timer expires with no activity: resolves — nothing to measure.
 *
 * ### Phase 2: Debounce
 * Once the first measurement arrives, subsequent measurements reset a debounce timer.
 * When no measurements arrive for `debounceMs`, measurements are considered settled.
 *
 * @example
 * ```typescript
 * tracker.requestTracking({ discoveryWindowMs: 50, debounceMs: 50 });
 * tracker.registerParticipants(['node:abc', 'edge:xyz']); // starts discovery window
 *
 * // ResizeObserver fired for a participant — extend if running low
 * tracker.signalObserverActivity('node:abc');
 *
 * // Measurement arrived — transition to debounce
 * tracker.signalMeasurement('node:abc');
 *
 * await tracker.waitForMeasurements();
 * ```
 *
 * @internal
 */
export class MeasurementTracker {
  private phase: Phase = 'idle';
  private participantIds = new Set<string>();
  private pendingConfig: MeasurementTrackingConfig | null = null;

  private discoveryWindow: PhaseTimer = { timeoutId: null, expiresAt: 0, durationMs: DEFAULT_DISCOVERY_WINDOW_TIMEOUT };
  private debounce: PhaseTimer = { timeoutId: null, expiresAt: 0, durationMs: DEFAULT_DEBOUNCE_TIMEOUT };

  private settlementPromise: Promise<void> | null = null;
  private settlementResolve: (() => void) | null = null;

  /**
   * Stages tracking configuration for the next middleware-driven registration pass.
   * Called before `applyUpdate()` when `waitForMeasurements` is requested.
   */
  requestTracking(config?: MeasurementTrackingConfig): void {
    this.pendingConfig = config ?? {};
  }

  /**
   * Returns true if tracking has been requested via `requestTracking()`.
   * Used by the measurement-tracking middleware to decide first-pass vs subsequent-pass mode.
   */
  isTrackingRequested(): boolean {
    return this.pendingConfig !== null;
  }

  /**
   * Registers entities that participated in the transaction.
   * Consumes the pending config from `requestTracking()`.
   *
   * If entityIds is empty (full no-op), just clears the pending config.
   * Otherwise, adds IDs to `participantIds` and starts the discovery window.
   *
   * @param entityIds - Prefixed entity IDs (e.g. 'node:abc', 'edge:xyz')
   */
  registerParticipants(entityIds: string[]): void {
    const config = this.pendingConfig;
    this.pendingConfig = null;

    if (entityIds.length === 0) return;

    if (config) {
      this.discoveryWindow.durationMs = config.discoveryWindowMs ?? DEFAULT_DISCOVERY_WINDOW_TIMEOUT;
      this.debounce.durationMs = config.debounceMs ?? DEFAULT_DEBOUNCE_TIMEOUT;
    }

    for (const id of entityIds) {
      this.participantIds.add(id);
    }

    this.phase = 'discoveryWindow';
    this.startTimer(this.discoveryWindow);
  }

  /**
   * Signals that a ResizeObserver fired for a participant entity before batch processing.
   * This is an early indicator that measurements are in the pipeline (the double-RAF
   * processing hasn't delivered them yet).
   *
   * In both phases, if the remaining time is below `OBSERVER_ACTIVITY_MIN_REMAINING`,
   * the active timer resets to its full duration.
   */
  signalObserverActivity(entityId: string): void {
    if (this.phase === 'idle') return;
    if (!this.participantIds.has(entityId)) return;

    const timer = this.activeTimer();
    if (this.remainingTime(timer) < OBSERVER_ACTIVITY_MIN_REMAINING) {
      this.startTimer(timer);
    }
  }

  /**
   * Signals that an actual measurement arrived for a participant entity
   * (e.g., `measuredPorts`, `size`, `position`, `measuredLabels` changed via `setState`).
   *
   * - During discovery window: transitions to debounce phase.
   * - During debounce phase: resets the debounce timer.
   */
  signalMeasurement(entityId: string): void {
    if (this.phase === 'idle') return;
    if (!this.participantIds.has(entityId)) return;

    if (this.phase === 'discoveryWindow') {
      this.clearTimer(this.discoveryWindow);
    }

    this.phase = 'debounce';
    this.startTimer(this.debounce);
  }

  /**
   * Returns a promise that resolves when all currently pending measurements are complete.
   * If there are no pending measurements, resolves immediately.
   */
  waitForMeasurements(): Promise<void> {
    if (!this.hasPendingMeasurements()) {
      return Promise.resolve();
    }

    if (this.settlementPromise) {
      return this.settlementPromise;
    }

    this.settlementPromise = new Promise<void>((resolve) => {
      this.settlementResolve = resolve;
    });

    return this.settlementPromise;
  }

  hasPendingMeasurements(): boolean {
    return this.phase !== 'idle';
  }

  // -- State machine internals --

  private activeTimer(): PhaseTimer {
    return this.phase === 'discoveryWindow' ? this.discoveryWindow : this.debounce;
  }

  private remainingTime(timer: PhaseTimer): number {
    return timer.expiresAt - Date.now();
  }

  private startTimer(timer: PhaseTimer): void {
    this.clearTimer(timer);
    timer.expiresAt = Date.now() + timer.durationMs;
    timer.timeoutId = setTimeout(() => {
      this.resolve();
    }, timer.durationMs) as unknown as number;
  }

  private clearTimer(timer: PhaseTimer): void {
    if (timer.timeoutId) {
      clearTimeout(timer.timeoutId);
      timer.timeoutId = null;
    }
  }

  private resolve(): void {
    this.phase = 'idle';
    this.participantIds.clear();
    this.clearTimer(this.discoveryWindow);
    this.clearTimer(this.debounce);

    if (this.settlementResolve) {
      this.settlementResolve();
      this.settlementResolve = null;
      this.settlementPromise = null;
    }
  }
}
