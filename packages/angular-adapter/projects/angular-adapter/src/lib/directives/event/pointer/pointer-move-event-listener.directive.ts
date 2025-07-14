import { Directive, inject, input } from '@angular/core';

import { EventType } from '@angularflow/core';
import { EventMapperService } from '../../../services';

@Directive({
  selector: '[angularAdapterPointerMoveEventListener]',
  host: { '(pointermove)': 'onPointerMove($event)' },
})
export class PointerMoveEventListenerDirective {
  private readonly eventMapperService = inject(EventMapperService);
  eventName = input<EventType>('unknown');

  onPointerMove(event: PointerEvent) {
    this.eventMapperService.emit(event, {
      name: this.eventName(),
      target: { type: 'diagram' },
    });
  }
}
