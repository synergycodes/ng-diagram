// Delay before considering zoom complete (ms)
const ZOOM_IDLE_DELAY = 300;

/**
 * Tracks zoom state to enable cache usage during active zooming.
 * During zooming, signals that cached results should be used to avoid lag.
 * After zoom stops, triggers a callback to refresh the view.
 */
export class ZoomTracker {
  private lastScale: number | null = null;
  private isZooming = false;
  private zoomIdleTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly onZoomEnd: () => void) {}

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

  destroy(): void {
    if (this.zoomIdleTimeout) {
      clearTimeout(this.zoomIdleTimeout);
      this.zoomIdleTimeout = null;
    }
  }

  private scheduleZoomIdle(): void {
    if (this.zoomIdleTimeout) {
      clearTimeout(this.zoomIdleTimeout);
    }

    this.zoomIdleTimeout = setTimeout(() => {
      this.isZooming = false;
      this.zoomIdleTimeout = null;
      this.onZoomEnd();
    }, ZOOM_IDLE_DELAY);
  }
}
