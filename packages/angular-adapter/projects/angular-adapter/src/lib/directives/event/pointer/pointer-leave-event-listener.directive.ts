import { Directive, inject, input } from '@angular/core';
import type { EventTarget, EventType } from '@angularflow/core';

import { EventMapperService } from '../../../services';
import { ITargetedEventListener } from '../../../types';

@Directive({
  selector: '[angularAdapterPointerLeaveEventListener]',
  host: { '(pointerleave)': 'onPointerLeave($event)' },
})
export class PointerLeaveEventListenerDirective implements ITargetedEventListener {
  private readonly eventMapperService = inject(EventMapperService);

  eventTarget = input<EventTarget>({ type: 'diagram' });
  eventName = input<EventType>('unknown');

  onPointerLeave(event: PointerEvent) {
    event.stopPropagation();
    this.eventMapperService.emit(event, {
      name: this.eventName(),
      target: this.eventTarget(),
    });
  }
}
