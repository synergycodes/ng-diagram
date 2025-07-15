import { Directive, inject, input } from '@angular/core';
import type { EventTarget } from '@angularflow/core';

import { CursorPositionTrackerService, EventMapperService } from '../../../services';
import { ITargetedEventListener } from '../../../types';

@Directive({
  selector: '[angularAdapterPointerDownEventListener]',
  host: { '(pointerdown)': 'onPointerDown($event)' },
})
export class PointerDownEventListenerDirective implements ITargetedEventListener {
  private readonly eventMapperService = inject(EventMapperService);
  private readonly cursorTracker = inject(CursorPositionTrackerService);

  eventTarget = input<EventTarget>({ type: 'diagram' });

  onPointerDown(event: PointerEvent) {
    event.stopPropagation();
    const currentTarget = event.currentTarget as HTMLElement;
    currentTarget.setPointerCapture(event.pointerId);

    // Update cursor position tracker
    this.cursorTracker.updatePosition(event.clientX, event.clientY);

    this.eventMapperService.emit({
      pointerId: event.pointerId,
      type: 'pointerdown',
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
