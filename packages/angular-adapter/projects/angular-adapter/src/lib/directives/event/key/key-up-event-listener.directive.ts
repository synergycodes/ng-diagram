import { Directive, HostListener, inject } from '@angular/core';

import { EventService } from '../../../services';

@Directive({
  selector: '[angularAdapterKeyUpEventListener]',
})
export class KeyUpEventListenerDirective {
  private readonly eventService = inject(EventService);

  @HostListener('document:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    this.eventService.handle({ type: 'keyup', event });
  }
}
