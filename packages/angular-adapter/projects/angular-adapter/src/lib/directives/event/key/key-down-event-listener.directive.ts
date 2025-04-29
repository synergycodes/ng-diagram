import { Directive, HostListener, inject } from '@angular/core';

import { EventService } from '../../../services';

@Directive({
  selector: '[angularAdapterKeyDownEventListener]',
})
export class KeyDownEventListenerDirective {
  private readonly eventService = inject(EventService);

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    this.eventService.handle({ type: 'keydown', event });
  }
}
