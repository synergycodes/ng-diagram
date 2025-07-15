import { Directive, inject } from '@angular/core';

import { CursorPositionTrackerService, EventMapperService } from '../../../services';

@Directive({
  selector: '[angularAdapterPointerMoveEventListener]',
  host: { '(pointermove)': 'onPointerMove($event)' },
})
export class PointerMoveEventListenerDirective {
  private readonly eventMapperService = inject(EventMapperService);
  private readonly cursorTracker = inject(CursorPositionTrackerService);

  onPointerMove(event: PointerEvent) {
    // Update cursor position tracker
    this.cursorTracker.updatePosition(event.clientX, event.clientY);

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
      cursorPosition: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  }
}
