import { Directive, inject } from '@angular/core';

import { EventMapperService } from '../../../services';

@Directive({
  selector: '[angularAdapterKeyUpEventListener]',
  host: { '(document:keyup)': 'onKeyUp($event)' },
})
export class KeyUpEventListenerDirective {
  private readonly eventMapperService = inject(EventMapperService);

  onKeyUp(event: KeyboardEvent) {
    this.eventMapperService.emit({
      type: 'keyup',
      target: { type: 'diagram' },
      timestamp: Date.now(),
      code: event.code,
      key: event.key,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
    });
  }
}
