import { Directive, inject, input } from '@angular/core';
import type { EventTarget } from '@angularflow/core';

import { EventMapperService } from '../../../services';
import { ITargetedEventListener } from '../../../types';

@Directive({
  selector: '[angularAdapterPointerDownEventListener]',
  host: { '(pointerdown)': 'onPointerDown($event)' },
})
export class PointerDownEventListenerDirective implements ITargetedEventListener {
  private readonly eventMapperService = inject(EventMapperService);

  eventTarget = input<EventTarget>({ type: 'diagram' });

  onPointerDown(event: PointerEvent) {
    event.stopPropagation();
    // const currentTarget = event.currentTarget as HTMLElement;
    // currentTarget.setPointerCapture(event.pointerId);
    this.eventMapperService.emit({
      type: 'pointerdown',
      target: this.eventTarget(),
      pressure: event.pressure,
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY,
      button: event.button,
    });
  }
}
