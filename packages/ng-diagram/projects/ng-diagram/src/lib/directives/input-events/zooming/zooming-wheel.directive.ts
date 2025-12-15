import { Directive, inject } from '@angular/core';
import { FlowCoreProviderService } from '../../../services/flow-core-provider/flow-core-provider.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';

@Directive({
  selector: '[ngDiagramZoomingWheel]',
  standalone: true,
  host: {
    '(wheel)': 'onWheel($event)',
  },
})
export class ZoomingWheelDirective {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly inputEventsRouterService = inject(InputEventsRouterService);

  onWheel(event: WheelEvent) {
    if (!this.shouldHandle(event)) {
      return;
    }
    console.log('zooming-wheel.directive.ts: onWheel');

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

  private shouldHandle(event: WheelEvent): boolean {
    // Zoom only when primary modifier is pressed
    return this.inputEventsRouterService.eventGuards.withPrimaryModifier(event);
  }
}
