import { Directive, inject } from '@angular/core';

import { EventMapperService } from '../../../services';

@Directive({
  selector: '[angularAdapterKeyPressEventListener]',
  host: { '(document:keypress)': 'onKeyPress($event)' },
})
export class KeyPressEventListenerDirective {
  private readonly eventMapperService = inject(EventMapperService);

  onKeyPress(event: KeyboardEvent) {
    this.eventMapperService.emit({
      type: 'keypress',
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
