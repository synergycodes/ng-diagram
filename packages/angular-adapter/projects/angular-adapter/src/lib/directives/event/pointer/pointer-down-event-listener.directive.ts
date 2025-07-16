import { Directive, inject, input } from '@angular/core';
import type { EventTarget, EventType } from '@angularflow/core';

import { EventMapperService } from '../../../services';
import { ITargetedEventListener } from '../../../types';

@Directive({
  selector: '[angularAdapterPointerDownEventListener]',
  host: { '(pointerdown)': 'onPointerDown($event)' },
})
export class PointerDownEventListenerDirective implements ITargetedEventListener {
  private readonly eventMapperService = inject(EventMapperService);

  eventTarget = input<EventTarget>({ type: 'diagram' });
  eventName = input<EventType>('unknown');

  onPointerDown(event: PointerEvent) {
    console.log('lalalalala');

    event.stopPropagation();
    const currentTarget = event.currentTarget as HTMLElement;
    currentTarget.setPointerCapture(event.pointerId);
    this.eventMapperService.emit(event, {
      name: this.eventName(),
      target: this.eventTarget(),
    });
  }
}
