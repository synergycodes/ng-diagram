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

    const zoomFactor = event.deltaY > 0 ? 1 - flow.config.zoom.step : 1 + flow.config.zoom.step;

    const baseEvent = this.inputEventsRouterService.getBaseEvent(event);
    this.inputEventsRouterService.emit({
      ...baseEvent,
      name: 'zoom',
      centerPoint: {
        x: event.clientX,
        y: event.clientY,
      },
      zoomFactor: zoomFactor,
    });
  }
}
