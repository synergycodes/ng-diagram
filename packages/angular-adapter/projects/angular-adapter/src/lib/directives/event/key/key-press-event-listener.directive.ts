import { Directive, HostListener, inject } from '@angular/core';

import { EventService } from '../../../services';

@Directive({
  selector: '[angularAdapterKeyPressEventListener]',
})
export class KeyPressEventListenerDirective {
  private readonly eventService = inject(EventService);

  @HostListener('document:keypress', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    this.eventService.handle({ type: 'keypress', event });
  }
}
