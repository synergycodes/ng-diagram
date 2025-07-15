import { Directive, inject, input } from '@angular/core';
import type { EventTarget } from '@angularflow/core';

import { CursorPositionTrackerService, EventMapperService } from '../../../services';
import { ITargetedEventListener } from '../../../types';

@Directive({
  selector: '[angularAdapterPointerUpEventListener]',
  host: { '(pointerup)': 'onPointerUp($event)' },
})
export class PointerUpEventListenerDirective implements ITargetedEventListener {
  private readonly eventMapperService = inject(EventMapperService);
  private readonly cursorTracker = inject(CursorPositionTrackerService);

  eventTarget = input<EventTarget>({ type: 'diagram' });

  onPointerUp(event: PointerEvent) {
    event.stopPropagation();

    // Update cursor position tracker
    this.cursorTracker.updatePosition(event.clientX, event.clientY);

    this.eventMapperService.emit({
      pointerId: event.pointerId,
      type: 'pointerup',
      target: this.eventTarget(),
      pressure: event.pressure,
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      cursorPosition: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  }
}
