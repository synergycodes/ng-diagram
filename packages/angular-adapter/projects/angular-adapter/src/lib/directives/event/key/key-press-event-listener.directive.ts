import { Directive, inject } from '@angular/core';

import { EventMapperService } from '../../../services';

@Directive({
  selector: '[angularAdapterKeyPressEventListener]',
  host: { '(document:keypress)': 'onKeyPress($event)' },
})
export class KeyPressEventListenerDirective {
  private readonly eventMapperService = inject(EventMapperService);

  onKeyPress(event: KeyboardEvent) {
    this.eventMapperService.emit(event, {
      name: 'press',
      target: { type: 'diagram' },
    });
  }
}
