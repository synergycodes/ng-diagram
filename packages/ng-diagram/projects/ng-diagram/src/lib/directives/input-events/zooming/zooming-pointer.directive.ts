import { Directive, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';
import { FlowCoreProviderService } from '../../../services/flow-core-provider/flow-core-provider.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PointerInputEvent, TouchInputEvent } from '../../../types';

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
export class ZoomingPointerDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly inputEventsRouterService = inject(InputEventsRouterService);

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
   * Minimal change in distance (in pixels) between two touch points required to trigger zoom.
   * Prevents accidental zooming on small finger movements.
   */
  private readonly ZOOM_TRIGGER_DELTA = 30;

  ngOnInit(): void {
    this.elementRef.nativeElement.addEventListener('pointerdown', this.onPointerEventCapture, { capture: true });
    this.elementRef.nativeElement.addEventListener('pointermove', this.onPointerEventCapture, { capture: true });
  }

  ngOnDestroy(): void {
    this.elementRef.nativeElement.removeEventListener('pointerdown', this.onPointerEventCapture, { capture: true });
    this.elementRef.nativeElement.removeEventListener('pointermove', this.onPointerEventCapture, { capture: true });
  }

  private onPointerEventCapture = (event: PointerInputEvent): void => {
    if (this.touchCache.length >= 2) {
      event.zoomingHandled = true;
    }
  };

  onTouchStart(event: TouchEvent) {
    for (const touch of event.changedTouches) {
      this.touchCache.push(touch);
    }
    if (this.touchCache.length === 2) {
      this.lastDistance = this.computeDistance();
      this.initialDistance = this.lastDistance;
    }
  }

  onTouchEnd(event: TouchEvent) {
    for (const touch of event.changedTouches) {
      this.removeTouchFromCache(touch);
    }
    if (this.touchCache.length < 2) {
      this.lastDistance = undefined;
      this.initialDistance = undefined;
      this.touchCache = [];
    }
  }

  onTouchMove(event: TouchInputEvent) {
    for (const touch of event.changedTouches) {
      this.updateTouchInCache(touch);
    }
    if (this.touchCache.length !== 2 || this.lastDistance === undefined || this.initialDistance === undefined) {
      return;
    }

    const currentDistance = this.computeDistance();
    const delta = Math.abs(currentDistance - this.initialDistance);

    if (delta > this.ZOOM_TRIGGER_DELTA) {
      event.zoomingHandled = true;

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
