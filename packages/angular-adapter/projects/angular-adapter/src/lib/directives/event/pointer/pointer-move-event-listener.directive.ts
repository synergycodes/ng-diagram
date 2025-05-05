import { Directive, HostListener, inject } from '@angular/core';

import { EventMapperService } from '../../../services';

@Directive({
  selector: '[angularAdapterPointerMoveEventListener]',
  standalone: true,
})
export class PointerMoveEventListenerDirective {
  private readonly eventMapperService = inject(EventMapperService);

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent) {
    this.eventMapperService.emit({
      type: 'pointermove',
      target: null,
      pressure: event.pressure,
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY,
    });
  }
}
