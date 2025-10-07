export class BatchInitializer<T> {
  private finished: Promise<void>;
  private finish: () => void = () => null;
  private stabilityTimeout: number | null = null;
  private hasReceivedData = false;
  private readonly stabilityDelay: number;
  private shouldWaitForData: boolean;
  private _isFinished = false;

  dataToInitialize = new Map<string, T>();
  private onInit: (dataMap: Map<string, T>) => void;

  constructor(onInit: (dataMap: Map<string, T>) => void, shouldWaitForData = true, stabilityDelay = 50) {
    this.onInit = onInit;
    this.shouldWaitForData = shouldWaitForData;
    this.stabilityDelay = stabilityDelay;

    this.finished = new Promise<void>((resolve) => {
      this.finish = () => {
        this._isFinished = true;
        resolve();
      };
    });
  }

  get isFinished(): boolean {
    return this._isFinished;
  }

  batchChange(key: string, value: T): boolean {
    // Don't accept new data if initialization is already finished
    if (this._isFinished) {
      return false;
    }

    this.dataToInitialize.set(key, value);
    this.hasReceivedData = true;

    // Reset stability timer on each new change
    this.resetStabilityTimer();
    return true;
  }

  waitForFinish(): Promise<void> {
    if (!this.shouldWaitForData) {
      // If we shouldn't wait for data (no nodes/edges), resolve immediately
      this.finish();
    } else if (this.shouldWaitForData && !this.hasReceivedData) {
      // If we should wait but haven't received any data yet,
      // start the stability timer to wait for incoming data
      this.resetStabilityTimer();
    }
    // If shouldWaitForData && hasReceivedData, the timer is already running from batchChange

    return this.finished;
  }

  private resetStabilityTimer(): void {
    // Clear existing timer
    if (this.stabilityTimeout) {
      clearTimeout(this.stabilityTimeout);
    }

    // Set new timer - if no changes for stabilityDelay ms, consider stable
    this.stabilityTimeout = window.setTimeout(() => {
      this.stabilityTimeout = null;
      // Process any pending data and mark as finished
      if (this.dataToInitialize.size > 0) {
        this.init();
      } else {
        this.finish();
      }
    }, this.stabilityDelay);
  }

  // No longer needed - we use stability timers instead
  // scheduleInit was for immediate batching, but now we wait for stability

  private processData(): void {
    this.onInit(this.dataToInitialize);
    this.dataToInitialize.clear();
  }

  init(): void {
    // Clear any pending stability timer
    if (this.stabilityTimeout) {
      clearTimeout(this.stabilityTimeout);
      this.stabilityTimeout = null;
    }

    // Process any remaining data
    if (this.dataToInitialize.size > 0) {
      this.processData();
    }

    // Mark as finished
    this.finish();
  }
}
