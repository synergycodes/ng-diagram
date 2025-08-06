export class BatchInitializer<T> {
  private finished: Promise<void>;
  private finish: () => void = () => null;
  private isScheduled = false;

  dataToInitialize = new Map<string, T>();
  private onInit: (dataMap: Map<string, T>) => void;

  constructor(onInit: (dataMap: Map<string, T>) => void) {
    this.onInit = onInit;

    this.finished = new Promise<void>((resolve) => {
      this.finish = resolve;
    });
  }

  batchChange(key: string, value: T): void {
    this.dataToInitialize.set(key, value);

    this.scheduleInit();
  }

  waitForFinish(): Promise<void> {
    this.scheduleInit();

    return this.finished;
  }

  scheduleInit(): void {
    if (this.isScheduled) {
      return;
    }

    this.isScheduled = true;
    queueMicrotask(() => this.init());
  }

  init(): void {
    this.onInit(this.dataToInitialize);
    this.dataToInitialize.clear();

    this.isScheduled = false;
    this.finish();
  }
}
