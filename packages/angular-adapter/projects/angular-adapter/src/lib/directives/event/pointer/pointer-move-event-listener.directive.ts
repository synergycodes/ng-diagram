import { Directive, inject } from '@angular/core';

import { EventMapperService } from '../../../services';

@Directive({
  selector: '[angularAdapterPointerMoveEventListener]',
  host: { '(pointermove)': 'onPointerMove($event)' },
})
export class PointerMoveEventListenerDirective {
  private readonly eventMapperService = inject(EventMapperService);

  onPointerMove(event: PointerEvent) {
    // event.stopPropagation();

    this.eventMapperService.emit({
      pointerId: event.pointerId,
      type: 'pointermove',
      target: { type: 'diagram' },
      pressure: event.pressure,
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
    });
  }
}
