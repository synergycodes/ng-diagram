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
    this.eventMapperService.emit(event, {
      name: 'wheel',
      target: { type: 'diagram' },
    });
  }
}
