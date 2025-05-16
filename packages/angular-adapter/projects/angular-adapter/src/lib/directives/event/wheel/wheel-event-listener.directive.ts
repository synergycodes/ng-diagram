import { Directive, inject } from '@angular/core';

import { EventMapperService } from '../../../services';

@Directive({
  selector: '[angularAdapterWheelEventListener]',
  host: { '(wheel)': 'onWheel($event)' },
})
export class WheelEventListenerDirective {
  private readonly eventMapperService = inject(EventMapperService);

  onWheel(event: WheelEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.eventMapperService.emit({
      type: 'wheel',
      target: { type: 'diagram' },
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY,
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      deltaZ: event.deltaZ,
    });
  }
}
