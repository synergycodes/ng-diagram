import { Directive, inject, input } from '@angular/core';
import type { EventTarget } from '@angularflow/core';

import { EventMapperService } from '../../../services';
import { ITargetedEventListener } from '../../../types';

@Directive({
  selector: '[angularAdapterPointerEnterEventListener]',
  host: { '(pointerenter)': 'onPointerEnter($event)' },
})
export class PointerEnterEventListenerDirective implements ITargetedEventListener {
  private readonly eventMapperService = inject(EventMapperService);

  eventTarget = input<EventTarget>({ type: 'diagram' });

  onPointerEnter(event: PointerEvent) {
    event.stopPropagation();
    this.eventMapperService.emit({
      pointerId: event.pointerId,
      type: 'pointerenter',
      target: this.eventTarget(),
      pressure: event.pressure,
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
    });
  }
}
