import { Directive, inject } from '@angular/core';
import { Point, ZOOMING_CONFIG } from '@angularflow/core';
import { FlowCoreProviderService } from '../../../services/flow-core-provider/flow-core-provider.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PointerInputEvent } from '../../../types/event';

@Directive({
  selector: '[angularAdapterZoomingPointer]',
  host: {
    // '(pointerdown)': 'onPointerDown($event)',
    // '(pointerup)': 'onPointerUp($event)',
    // '(pointermove)': 'onPointerMove($event)',
  },
})
export class ZoomingPointerDirective {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly inputEventsRouterService = inject(InputEventsRouterService);

  private eventCache: PointerInputEvent[] = [];
  private startPoint?: Point;
  private startDistance?: number;

  onPointerDown($event: PointerInputEvent) {
    if (this.isHandled($event)) {
      return;
    }

    this.addEvent($event);
    if (this.eventCache.length !== 2) {
      return;
    }

    const flow = this.flowCoreProvider.provide();
    const { x, y, scale } = flow.getState().metadata.viewport;

    this.startPoint = {
      x: ((this.eventCache[0].clientX + this.eventCache[1].clientX) / 2 - x) / scale,
      y: ((this.eventCache[0].clientY + this.eventCache[1].clientY) / 2 - y) / scale,
    };
    this.startDistance = this.computeDistance();

    this.eventCache.forEach((event) => {
      event.zoomingHandled = true;
    });
  }

  onPointerUp($event: PointerInputEvent) {
    if (this.isHandled($event)) {
      return;
    }

    this.removeEvent($event);
    if (this.eventCache.length < 2) {
      this.startPoint = undefined;
      this.startDistance = undefined;
    }
  }

  onPointerMove($event: PointerInputEvent) {
    this.updateCache($event);

    if (this.eventCache.length !== 2 || this.startDistance === undefined || this.startPoint === undefined) {
      return;
    }

    this.eventCache.forEach((event) => {
      event.zoomingHandled = true;
    });

    const flow = this.flowCoreProvider.provide();
    let { x, y, scale } = flow.getState().metadata.viewport;

    this.startPoint = {
      x: (this.eventCache[0].clientX + this.eventCache[1].clientX) / 2,
      y: (this.eventCache[0].clientY + this.eventCache[1].clientY) / 2,
    };

    const beforeZoomX = (this.startPoint.x - x) / scale;
    const beforeZoomY = (this.startPoint.y - y) / scale;
    const deltaDistance = this.computeDistance() / this.startDistance;
    const zoomFactor = Math.min(Math.max(1 - ZOOMING_CONFIG.STEP, deltaDistance), 1 + ZOOMING_CONFIG.STEP);

    scale *= zoomFactor;
    scale = Math.min(Math.max(ZOOMING_CONFIG.MIN, scale), ZOOMING_CONFIG.MAX);

    const afterZoomX = (this.startPoint.x - x) / scale;
    const afterZoomY = (this.startPoint.y - y) / scale;

    x += (afterZoomX - beforeZoomX) * scale;
    y += (afterZoomY - beforeZoomY) * scale;

    const baseEvent = this.inputEventsRouterService.getBaseEvent($event);
    this.inputEventsRouterService.emit({
      ...baseEvent,
      name: 'zoom',
      updatedViewport: {
        x,
        y,
      },
      updateScale: scale,
    });
  }

  private addEvent(event: PointerInputEvent) {
    this.eventCache.push(event);
  }

  private removeEvent(event: PointerInputEvent) {
    const index = this.eventCache.findIndex((cachedEvent) => cachedEvent.pointerId === event.pointerId);
    this.eventCache.splice(index, 1);
  }

  private computeDistance(): number {
    return Math.hypot(
      this.eventCache[0].clientX - this.eventCache[1].clientX,
      this.eventCache[0].clientY - this.eventCache[1].clientY
    );
  }

  private updateCache(event: PointerEvent) {
    const index = this.eventCache.findIndex((cachedEvent) => cachedEvent.pointerId === event.pointerId);
    this.eventCache[index] = event;
  }

  private isHandled(event: PointerInputEvent): boolean {
    return !!event.linkingHandled;
  }
}
