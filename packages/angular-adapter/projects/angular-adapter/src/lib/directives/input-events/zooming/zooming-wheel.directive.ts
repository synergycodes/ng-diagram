import { Directive, inject } from '@angular/core';
import { DEFAULT_ZOOMING_CONFIG } from '@angularflow/core';
import { FlowCoreProviderService } from '../../../services/flow-core-provider/flow-core-provider.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';

@Directive({
  selector: '[angularAdapterZooming]',
  host: {
    '(wheel)': 'onWheel($event)',
  },
})
export class ZoomingWheelDirective {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly inputEventsRouterService = inject(InputEventsRouterService);

  onWheel(event: WheelEvent) {
    event.stopPropagation();
    event.preventDefault();

    const zoomFactor = event.deltaY > 0 ? 1 - DEFAULT_ZOOMING_CONFIG.STEP : 1 + DEFAULT_ZOOMING_CONFIG.STEP;

    let { x, y, scale } = this.flowCoreProvider.provide().getState().metadata.viewport;
    const beforeZoomX = (event.clientX - x) / scale;
    const beforeZoomY = (event.clientY - y) / scale;

    scale *= zoomFactor;
    scale = Math.min(Math.max(DEFAULT_ZOOMING_CONFIG.MIN, scale), DEFAULT_ZOOMING_CONFIG.MAX);

    const afterZoomX = (event.clientX - x) / scale;
    const afterZoomY = (event.clientY - y) / scale;

    x += (afterZoomX - beforeZoomX) * scale;
    y += (afterZoomY - beforeZoomY) * scale;

    const baseEvent = this.inputEventsRouterService.getBaseEvent(event);
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
}
