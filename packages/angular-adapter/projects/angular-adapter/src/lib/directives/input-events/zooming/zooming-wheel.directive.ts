import { Directive, inject } from '@angular/core';
import { FlowCoreProviderService } from '../../../services/flow-core-provider/flow-core-provider.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';

@Directive({
  selector: '[ngDiagramZooming]',
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

    const flow = this.flowCoreProvider.provide();
    let { x, y, scale } = flow.getState().metadata.viewport;

    const zoomFactor = event.deltaY > 0 ? 1 - flow.config.zoom.step : 1 + flow.config.zoom.step;

    const beforeZoomX = (event.clientX - x) / scale;
    const beforeZoomY = (event.clientY - y) / scale;

    scale *= zoomFactor;
    scale = Math.min(Math.max(flow.config.zoom.min, scale), flow.config.zoom.max);

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
