import { Directive, inject } from '@angular/core';

import { CursorPositionTrackerService, EventMapperService } from '../../../services';

@Directive({
  selector: '[angularAdapterKeyDownEventListener]',
  host: { '(document:keydown)': 'onKeyDown($event)' },
})
export class KeyDownEventListenerDirective {
  private readonly eventMapperService = inject(EventMapperService);
  private readonly cursorTracker = inject(CursorPositionTrackerService);

  onKeyDown(event: KeyboardEvent) {
    this.eventMapperService.emit({
      type: 'keydown',
      target: { type: 'diagram' },
      timestamp: Date.now(),
      code: event.code,
      key: event.key,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      cursorPosition: this.cursorTracker.hasRecentPosition() ? this.cursorTracker.getLastPosition() : undefined,
    });
  }
}
