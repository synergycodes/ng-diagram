import { Directive, ElementRef, inject } from '@angular/core';
import { FlowCoreProviderService } from '../../../services/flow-core-provider/flow-core-provider.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { TouchEventsStateService } from '../../../services/touch-events-state-service/touch-events-state-service.service';
import { DiagramEventName } from '../../../types';

@Directive({
  selector: '[ngDiagramZoomingPointer]',
  standalone: true,
  host: {
    '(touchstart)': 'onTouchStart($event)',
    '(touchend)': 'onTouchEnd($event)',
    '(touchmove)': 'onTouchMove($event)',
    '(touchcancel)': 'onTouchEnd($event)',
  },
})
export class MobileZoomingDirective {
  private readonly elementRef = inject(ElementRef);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly inputEventsRouterService = inject(InputEventsRouterService);
  private readonly touchEventsStateService = inject(TouchEventsStateService);

  private touchCache: Touch[] = [];

  /**
   * Stores the last distance between two touch points during a pinch gesture.
   * Used to calculate the zoom factor smoothly on each move event.
   */
  private lastDistance?: number;

  /**
   * Stores the initial distance between two touch points at the start of a pinch gesture.
   * Used to determine if the gesture should be recognized as a zoom (pinch) based on a threshold.
   */
  private initialDistance?: number;

  /**
   * Flag indicating if zooming gesture is currently active.
   * Once set to true, it remains true until all fingers are lifted.
   */
  private isZoomingActive = false;

  /**
   * Minimal change in distance (in pixels) between two touch points required to trigger zoom.
   * Prevents accidental zooming on small finger movements.
   */
  private readonly ZOOM_TRIGGER_DELTA = 40;

  onTouchStart(event: TouchEvent) {
    for (const touch of event.changedTouches) {
      this.touchCache.push(touch);
    }
    if (this.touchCache.length === 2) {
      this.lastDistance = this.computeDistance();
      this.initialDistance = this.lastDistance;
      this.isZoomingActive = false; // Reset flag when starting new two-finger gesture
    }
  }

  onTouchEnd(event: TouchEvent) {
    for (const touch of event.changedTouches) {
      this.removeTouchFromCache(touch);
    }
    if (this.touchCache.length < 2) {
      this.lastDistance = undefined;
      this.initialDistance = undefined;
      this.isZoomingActive = false;
      this.touchCache = [];
      this.touchEventsStateService.clearCurrentEvent();
    }
  }

  onTouchMove(event: TouchEvent) {
    for (const touch of event.changedTouches) {
      this.updateTouchInCache(touch);
    }
    if (this.touchCache.length !== 2 || this.lastDistance === undefined || this.initialDistance === undefined) {
      return;
    }

    const currentDistance = this.computeDistance();
    const delta = Math.abs(currentDistance - this.initialDistance);

    /**
     * Once zooming is active, keep it active until fingers are lifted
     * Check if the distance change indicates a pinch gesture (zooming)
     * Not enough distance change yet, don't interfere with panning
     */
    if (!this.isZoomingActive) {
      if (delta > this.ZOOM_TRIGGER_DELTA) {
        this.isZoomingActive = true;
        this.touchEventsStateService.currentEvent.set(DiagramEventName.Zooming);
      } else {
        return;
      }
    }

    const flow = this.flowCoreProvider.provide();
    const centerX = (this.touchCache[0].clientX + this.touchCache[1].clientX) / 2;
    const centerY = (this.touchCache[0].clientY + this.touchCache[1].clientY) / 2;
    const distanceRatio = currentDistance / this.lastDistance;
    const zoomFactor = Math.min(Math.max(1 - flow.config.zoom.step, distanceRatio), 1 + flow.config.zoom.step);

    this.lastDistance = currentDistance;

    const baseEvent = this.inputEventsRouterService.getBaseEvent(event);
    this.inputEventsRouterService.emit({
      ...baseEvent,
      name: 'zoom',
      centerPoint: { x: centerX, y: centerY },
      zoomFactor: zoomFactor,
    });
  }

  private removeTouchFromCache(touch: Touch) {
    const index = this.touchCache.findIndex((cachedTouch) => cachedTouch.identifier === touch.identifier);
    if (index !== -1) {
      this.touchCache.splice(index, 1);
    }
  }

  private computeDistance(): number {
    return Math.hypot(
      this.touchCache[0].clientX - this.touchCache[1].clientX,
      this.touchCache[0].clientY - this.touchCache[1].clientY
    );
  }

  private updateTouchInCache(touch: Touch) {
    const index = this.touchCache.findIndex((cachedTouch) => cachedTouch.identifier === touch.identifier);
    if (index !== -1) {
      this.touchCache[index] = touch;
    }
  }
}
