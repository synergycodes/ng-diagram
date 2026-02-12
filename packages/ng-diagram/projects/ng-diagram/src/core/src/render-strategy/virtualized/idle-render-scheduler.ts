import type { FlowCore } from '../../flow-core';

/**
 * Schedules render callbacks after panning stops.
 * Debounces rapid pan-stop-pan sequences using configurable delay.
 */
export class IdleRenderScheduler {
  private wasPanning = false;
  private idleTimeout: ReturnType<typeof setTimeout> | null = null;
  private unsubscribeActionState: (() => void) | null = null;

  constructor(
    private readonly flowCore: FlowCore,
    private readonly onIdle: () => void
  ) {}

  init(): void {
    this.unsubscribeActionState = this.flowCore.eventManager.on('actionStateChanged', ({ actionState }) => {
      const isPanning = !!actionState.panning?.active;

      if (this.wasPanning && !isPanning) {
        this.scheduleIdleRender();
      } else if (isPanning && this.idleTimeout) {
        clearTimeout(this.idleTimeout);
        this.idleTimeout = null;
      }

      this.wasPanning = isPanning;
    });
  }

  private scheduleIdleRender(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    const delay = this.flowCore.config.virtualization.idleDelay ?? 100;
    this.idleTimeout = setTimeout(() => {
      this.onIdle();
      this.idleTimeout = null;
    }, delay);
  }

  destroy(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
    if (this.unsubscribeActionState) {
      this.unsubscribeActionState();
      this.unsubscribeActionState = null;
    }
  }
}
