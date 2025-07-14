import { Directive, inject } from '@angular/core';

import { EventMapperService } from '../../../services';

@Directive({
  selector: '[angularAdapterKeyDownEventListener]',
  host: { '(document:keydown)': 'onKeyDown($event)' },
})
export class KeyDownEventListenerDirective {
  private readonly eventMapperService = inject(EventMapperService);

  onKeyDown(event: KeyboardEvent) {
    this.eventMapperService.emit(event, {
      name: 'press',
      target: { type: 'diagram' },
    });
  }
}
