/**
 * A simple async semaphore implementation for controlling concurrent access
 */
export class Semaphore {
  private permits: number;
  private waiting: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  /**
   * Acquires a permit, waiting if necessary until one is available
   */
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.waiting.push(resolve);
    });
  }

  /**
   * Releases a permit, potentially allowing a waiting acquirer to proceed
   */
  release(): void {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!;
      resolve();
    } else {
      this.permits++;
    }
  }

  /**
   * Returns the number of available permits
   */
  availablePermits(): number {
    return this.permits;
  }

  /**
   * Returns the number of threads waiting to acquire a permit
   */
  getQueueLength(): number {
    return this.waiting.length;
  }
}
