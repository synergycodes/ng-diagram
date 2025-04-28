import { Directive, HostListener, inject } from '@angular/core';

import { EventService } from '../../../services';

@Directive({
  selector: '[angularAdapterPointerMoveEventListener]',
  standalone: true,
})
export class PointerMoveEventListenerDirective {
  private readonly eventService = inject(EventService);

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent) {
    this.eventService.handle({ type: 'pointermove', event });
  }
}
