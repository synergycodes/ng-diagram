import type { FlowCore } from '../flow-core';

/**
 * Manages buffer filling during pan idle time.
 * After panning stops, schedules rendering with expanded buffer to preload
 * nodes in all directions for smoother subsequent panning.
 */
export class BufferFillManager {
  private fillTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribePanStarted: (() => void) | null = null;
  private unsubscribePanEnded: (() => void) | null = null;

  constructor(
    private readonly flowCore: FlowCore,
    private readonly idleThreshold: number
  ) {
    this.setupListeners();
  }

  private setupListeners(): void {
    this.unsubscribePanEnded = this.flowCore.eventManager.on('panEnded', () => {
      this.scheduleFill();
    });

    this.unsubscribePanStarted = this.flowCore.eventManager.on('panStarted', () => {
      this.cancelFill();
    });
  }

  private scheduleFill(): void {
    this.cancelFill();
    this.fillTimer = setTimeout(() => {
      this.executeFill();
    }, this.idleThreshold);
  }

  private cancelFill(): void {
    if (this.fillTimer !== null) {
      clearTimeout(this.fillTimer);
      this.fillTimer = null;
    }
  }

  private executeFill(): void {
    this.flowCore.renderWithExpandedBuffer();
    this.fillTimer = null;
  }

  destroy(): void {
    this.cancelFill();
    this.unsubscribePanStarted?.();
    this.unsubscribePanEnded?.();
  }
}
