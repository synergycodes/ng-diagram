import { Directive, HostListener, inject } from '@angular/core';

import { EventMapperService } from '../../../services';

@Directive({
  selector: '[angularAdapterKeyDownEventListener]',
})
export class KeyDownEventListenerDirective {
  private readonly eventMapperService = inject(EventMapperService);

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    this.eventMapperService.emit({
      type: 'keydown',
      target: null,
      timestamp: Date.now(),
      code: event.code,
      key: event.key,
    });
  }
}
