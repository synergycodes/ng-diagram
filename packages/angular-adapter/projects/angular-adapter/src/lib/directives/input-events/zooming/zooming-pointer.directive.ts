import { Directive, inject } from '@angular/core';
import { FlowCoreProviderService } from '../../../services/flow-core-provider/flow-core-provider.service';

@Directive({
  selector: '[angularAdapterZoomingPointer]',
  host: {
    '(touchstart)': 'onTouchStart($event)',
    '(touchend)': 'onTouchEnd($event)',
    '(touchmove)': 'onTouchMove($event)',
  },
})
export class ZoomingPointerDirective {
  static IsZoomingPointer = false;

  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  private touchCache: Touch[] = [];
  private lastDistance?: number;

  onTouchStart(event: TouchEvent) {
    ZoomingPointerDirective.IsZoomingPointer = true;

    // Add new touches to cache
    for (const touch of event.changedTouches) {
      this.touchCache.push(touch);
    }

    // Initialize distance when we have exactly 2 touches
    if (this.touchCache.length === 2) {
      this.lastDistance = this.computeDistance();
    }
  }

  onTouchEnd(event: TouchEvent) {
    ZoomingPointerDirective.IsZoomingPointer = false;

    // Remove ended touches from cache
    for (const touch of event.changedTouches) {
      this.removeTouchFromCache(touch);
    }

    // Reset when we don't have 2 touches anymore
    if (this.touchCache.length < 2) {
      this.lastDistance = undefined;
    }
  }

  onTouchMove(event: TouchEvent) {
    ZoomingPointerDirective.IsZoomingPointer = true;

    // Update cache with moved touches
    for (const touch of event.changedTouches) {
      this.updateTouchInCache(touch);
    }

    // Only zoom with exactly 2 touches and valid last distance
    if (this.touchCache.length !== 2 || this.lastDistance === undefined) {
      return;
    }

    const flow = this.flowCoreProvider.provide();
    let { x, y, scale } = flow.getState().metadata.viewport;

    // Calculate current center and distance
    const centerX = (this.touchCache[0].clientX + this.touchCache[1].clientX) / 2;
    const centerY = (this.touchCache[0].clientY + this.touchCache[1].clientY) / 2;
    const currentDistance = this.computeDistance();

    // Calculate zoom factor based on distance change
    const distanceRatio = currentDistance / this.lastDistance;
    const zoomFactor = Math.min(Math.max(1 - flow.config.zoom.step, distanceRatio), 1 + flow.config.zoom.step);

    // Apply zoom with center point preservation
    const beforeZoomX = (centerX - x) / scale;
    const beforeZoomY = (centerY - y) / scale;

    scale *= zoomFactor;
    scale = Math.min(Math.max(flow.config.zoom.min, scale), flow.config.zoom.max);

    const afterZoomX = (centerX - x) / scale;
    const afterZoomY = (centerY - y) / scale;

    x += (afterZoomX - beforeZoomX) * scale;
    y += (afterZoomY - beforeZoomY) * scale;

    // Update for next iteration
    this.lastDistance = currentDistance;

    // Apply zoom
    flow.commandHandler.emit('zoom', { x, y, scale });
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
