import { Directive, inject } from '@angular/core';

import { EventMapperService } from '../../../services';

@Directive({
  selector: '[angularAdapterKeyUpEventListener]',
  host: { '(document:keyup)': 'onKeyUp($event)' },
})
export class KeyUpEventListenerDirective {
  private readonly eventMapperService = inject(EventMapperService);

  onKeyUp(event: KeyboardEvent) {
    this.eventMapperService.emit(event, {
      name: 'press',
      target: { type: 'diagram' },
    });
  }
}
