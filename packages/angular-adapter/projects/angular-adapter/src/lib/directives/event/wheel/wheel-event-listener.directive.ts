import { Directive, inject } from '@angular/core';

import { CursorPositionTrackerService, EventMapperService } from '../../../services';

@Directive({
  selector: '[angularAdapterWheelEventListener]',
  host: { '(wheel)': 'onWheel($event)' },
})
export class WheelEventListenerDirective {
  private readonly eventMapperService = inject(EventMapperService);
  private readonly cursorTracker = inject(CursorPositionTrackerService);

  onWheel(event: WheelEvent) {
    event.stopPropagation();
    event.preventDefault();

    // Update cursor position tracker
    this.cursorTracker.updatePosition(event.clientX, event.clientY);

    this.eventMapperService.emit({
      type: 'wheel',
      target: { type: 'diagram' },
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY,
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      deltaZ: event.deltaZ,
      cursorPosition: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  }
}
