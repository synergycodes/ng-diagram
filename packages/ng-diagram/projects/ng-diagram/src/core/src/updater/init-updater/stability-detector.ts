/**
 * StabilityDetector notifies when a stream of events has stabilized (stopped arriving).
 *
 * Purpose: Wait for a series of events to stabilize before proceeding.
 * Generic detector that doesn't store any data - only tracks timing of events.
 *
 * How it works:
 * - Each `notify()` call resets a debounce timer
 * - When no more events arrive for `stabilityDelay` ms, stability is reached
 * - `waitForStability()` returns a promise that resolves when stable
 *
 * @example
 * ```ts
 * const detector = new StabilityDetector(true, 50);
 *
 * // Signal events
 * detector.notify(); // Event 1
 * detector.notify(); // Event 2 (timer resets)
 * detector.notify(); // Event 3 (timer resets)
 *
 * // Wait for stability (resolves 50ms after last notify)
 * await detector.waitForStability();
 * ```
 */
export class StabilityDetector {
  /** Active debounce timer, cleared and reset on each notify() */
  private stabilityTimeout: number | null = null;

  /** Promise that resolves when stability is reached */
  private stabilityPromise: Promise<void>;

  /** Resolver function for the stability promise */
  private resolveStability: () => void = () => null;

  /** Count of events received (for logging/debugging) */
  private eventCount = 0;

  /**
   * Creates a new StabilityDetector.
   *
   * @param shouldWait - If false, stability is immediate (no waiting)
   * @param stabilityDelay - Milliseconds of inactivity before considering stable
   */
  constructor(
    private readonly shouldWait: boolean,
    private readonly stabilityDelay: number
  ) {
    this.stabilityPromise = new Promise<void>((resolve) => {
      this.resolveStability = resolve;
    });
  }

  /**
   * Signals that an event occurred. Resets the stability timer.
   * Each call restarts the countdown - stability is only reached after
   * stabilityDelay ms with no notify() calls.
   */
  notify(): void {
    this.eventCount++;
    this.resetStabilityTimer();
  }

  /**
   * Returns a promise that resolves when activity has stabilized.
   *
   * Behavior:
   * - If shouldWait is false: Resolves immediately
   * - If no events yet: Starts timer, waits for incoming events
   * - If events occurred: Timer already running from notify() calls
   *
   * @returns Promise that resolves when stable (no activity for stabilityDelay ms)
   */
  waitForStability(): Promise<void> {
    if (!this.shouldWait) {
      this.resolveStability();
    } else if (this.eventCount === 0) {
      // No activity yet, start waiting for incoming events
      this.resetStabilityTimer();
    }
    // If activity exists, timer is already running from notify() calls

    return this.stabilityPromise;
  }

  /**
   * Resets the debounce timer.
   * Clears any existing timer and starts a new countdown.
   */
  private resetStabilityTimer(): void {
    if (this.stabilityTimeout) {
      clearTimeout(this.stabilityTimeout);
    }

    this.stabilityTimeout = window.setTimeout(() => {
      this.resolveStability();
      this.stabilityTimeout = null;
    }, this.stabilityDelay);
  }
}
