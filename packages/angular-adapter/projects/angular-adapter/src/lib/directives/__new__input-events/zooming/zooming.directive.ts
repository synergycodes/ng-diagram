import { Directive, inject } from '@angular/core';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';

@Directive({
  selector: '[angularAdapterZooming]',
  host: {
    '(wheel)': 'onWheel($event)',
  },
})
export class ZoomingDirective {
  private readonly inputEventsRouterService = inject(InputEventsRouterService);
  onWheel(event: WheelEvent) {
    event.stopPropagation();
    event.preventDefault();

    const baseEvent = this.inputEventsRouterService.getBaseEvent(event);
    this.inputEventsRouterService.emit({
      ...baseEvent,
      name: 'zoom',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
      deltaY: event.deltaY,
    });
  }
}
