export class BatchInitializer<T> {
  private finished: Promise<void>;
  private finish: () => void = () => null;
  private isScheduled = false;

  dataToInitialize = new Map<string, T>();
  private onInit: (dataMap: Map<string, T>) => void;

  isFinished = false;

  constructor(onInit: (dataMap: Map<string, T>) => void, init?: boolean) {
    this.onInit = onInit;

    this.finished = new Promise<void>((resolve) => {
      this.finish = resolve;
    });

    if (init) {
      this.finish();
    }
  }

  waitForFinish(): Promise<void> {
    return this.finished;
  }

  scheduleInit(key: string, value: T): void {
    this.dataToInitialize.set(key, value);

    if (this.isScheduled) {
      return;
    }

    this.isScheduled = true;
    queueMicrotask(() => this.init());
  }

  init(): void {
    this.onInit(this.dataToInitialize);
    this.dataToInitialize.clear();

    this.isFinished = true;
    this.finish();
  }
}
