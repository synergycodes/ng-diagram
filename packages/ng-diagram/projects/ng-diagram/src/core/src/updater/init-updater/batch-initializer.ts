/**
 * BatchInitializer collects data and notifies when it has stabilized.
 *
 * Purpose: Wait for entity creation (ports, labels) to stabilize before proceeding.
 * The data is kept accessible for later processing.
 */
export class BatchInitializer<T> {
  private stabilityTimeout: number | null = null;
  private stabilityPromise: Promise<void>;
  private resolveStability: () => void = () => null;

  readonly data = new Map<string, T>();

  constructor(
    private readonly shouldWait: boolean,
    private readonly stabilityDelay: number
  ) {
    this.stabilityPromise = new Promise<void>((resolve) => {
      this.resolveStability = resolve;
    });
  }

  /**
   * Add data to the batch. Resets the stability timer.
   */
  add(key: string, value: T): void {
    this.data.set(key, value);
    this.resetStabilityTimer();
  }

  /**
   * Returns a promise that resolves when the data has stabilized.
   * - If shouldWait is false, resolves immediately
   * - If no data has been added yet, starts waiting for incoming data
   * - If data exists, the timer is already running from add() calls
   */
  waitForStability(): Promise<void> {
    if (!this.shouldWait) {
      this.resolveStability();
    } else if (this.data.size === 0) {
      // No data yet, start waiting for incoming data
      this.resetStabilityTimer();
    }
    // If data exists, timer is already running from add() calls

    return this.stabilityPromise;
  }

  private resetStabilityTimer(): void {
    if (this.stabilityTimeout) {
      clearTimeout(this.stabilityTimeout);
    }

    this.stabilityTimeout = window.setTimeout(() => {
      console.log(`[BatchInitializer] Stability reached with ${this.data.size} items`);
      this.resolveStability();
      this.stabilityTimeout = null;
    }, this.stabilityDelay);
  }
}
