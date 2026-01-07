import type { EventManager } from '../../event-manager/event-manager';
import type { VirtualizationConfig } from '../../types';

// Delay before recomputing after zoom stops (ms)
const ZOOM_IDLE_DELAY = 150;

/**
 * Manages idle detection for pan/zoom operations.
 * Triggers expanded buffer rendering after user stops interacting.
 */
export class IdleManager {
  private lastScale: number | null = null;
  private zoomIdleTimeout: ReturnType<typeof setTimeout> | null = null;
  private isZooming = false;

  private panIdleTimeout: ReturnType<typeof setTimeout> | null = null;
  private wasPanning = false;
  private unsubscribeActionState: (() => void) | null = null;

  private pendingExpandedBuffer = false;

  constructor(
    private readonly config: VirtualizationConfig,
    private readonly onIdle: () => void
  ) {}

  /**
   * Subscribes to action state changes to detect pan start/end.
   */
  subscribeToActionState(eventManager: EventManager): void {
    this.unsubscribeActionState = eventManager.on('actionStateChanged', ({ actionState }) => {
      const isPanning = !!actionState.panning?.active;

      if (this.wasPanning && !isPanning) {
        this.schedulePanIdle();
      } else if (!this.wasPanning && isPanning) {
        this.cancelPanIdle();
      }

      this.wasPanning = isPanning;
    });
  }

  /**
   * Checks for scale changes and manages zoom idle state.
   * Call this on each process() with the current scale.
   */
  handleScaleChange(currentScale: number): void {
    const scaleChanged = this.lastScale !== null && this.lastScale !== currentScale;

    if (scaleChanged) {
      this.isZooming = true;
      this.scheduleZoomIdle();
    }

    this.lastScale = currentScale;
  }

  getIsZooming(): boolean {
    return this.isZooming;
  }

  /**
   * Consumes and returns the pending expanded buffer flag.
   * Returns true if expanded buffer should be used, then clears the flag.
   */
  consumePendingExpandedBuffer(): boolean {
    if (this.pendingExpandedBuffer) {
      this.pendingExpandedBuffer = false;
      return true;
    }
    return false;
  }

  destroy(): void {
    if (this.zoomIdleTimeout) {
      clearTimeout(this.zoomIdleTimeout);
      this.zoomIdleTimeout = null;
    }
    this.cancelPanIdle();
    this.unsubscribeActionState?.();
    this.unsubscribeActionState = null;
  }

  /**
   * Schedules a callback to mark zooming as complete after idle period.
   */
  private scheduleZoomIdle(): void {
    if (this.zoomIdleTimeout) {
      clearTimeout(this.zoomIdleTimeout);
    }

    this.zoomIdleTimeout = setTimeout(() => {
      this.isZooming = false;
      this.zoomIdleTimeout = null;
      this.triggerExpandedBufferRender();
    }, ZOOM_IDLE_DELAY);
  }

  private schedulePanIdle(): void {
    if (!this.config.bufferFill.enabled) {
      return;
    }

    this.cancelPanIdle();
    const idleThreshold = this.config.bufferFill.idleThreshold;

    this.panIdleTimeout = setTimeout(() => {
      this.panIdleTimeout = null;
      this.triggerExpandedBufferRender();
    }, idleThreshold);
  }
  private cancelPanIdle(): void {
    if (this.panIdleTimeout !== null) {
      clearTimeout(this.panIdleTimeout);
      this.panIdleTimeout = null;
    }
  }

  private triggerExpandedBufferRender(): void {
    this.pendingExpandedBuffer = true;
    this.onIdle();
  }
}
