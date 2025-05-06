import { Directive, HostListener, inject } from '@angular/core';

import { EventMapperService } from '../../../services';

@Directive({
  selector: '[angularAdapterKeyUpEventListener]',
})
export class KeyUpEventListenerDirective {
  private readonly eventMapperService = inject(EventMapperService);

  @HostListener('document:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    this.eventMapperService.emit({
      type: 'keyup',
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
