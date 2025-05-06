import { Directive, HostListener, inject } from '@angular/core';

import { EventMapperService } from '../../../services';

@Directive({
  selector: '[angularAdapterKeyPressEventListener]',
})
export class KeyPressEventListenerDirective {
  private readonly eventMapperService = inject(EventMapperService);

  @HostListener('document:keypress', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    this.eventMapperService.emit({
      type: 'keypress',
      target: null,
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
