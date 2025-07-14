import { Directive, inject, input } from '@angular/core';
import type { EventTarget, EventType } from '@angularflow/core';

import { EventMapperService } from '../../../services';
import { ITargetedEventListener } from '../../../types';

@Directive({
  selector: '[angularAdapterPointerEnterEventListener]',
  host: { '(pointerenter)': 'onPointerEnter($event)' },
})
export class PointerEnterEventListenerDirective implements ITargetedEventListener {
  private readonly eventMapperService = inject(EventMapperService);

  eventTarget = input<EventTarget>({ type: 'diagram' });
  eventName = input<EventType>('unknown');

  onPointerEnter(event: PointerEvent) {
    event.stopPropagation();
    this.eventMapperService.emit(event, {
      name: this.eventName(),
      target: this.eventTarget(),
    });
  }
}
