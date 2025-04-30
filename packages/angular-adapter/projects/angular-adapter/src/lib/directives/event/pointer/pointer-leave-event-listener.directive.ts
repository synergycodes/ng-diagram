import { Directive, HostListener, inject, input } from '@angular/core';
import { Edge, Node } from '@angularflow/core';

import { EventMapperService } from '../../../services';
import { ITargetedEventListener } from '../../../types';

@Directive({
  selector: '[angularAdapterPointerLeaveEventListener]',
})
export class PointerLeaveEventListenerDirective implements ITargetedEventListener {
  private readonly eventMapperService = inject(EventMapperService);

  eventTarget = input<Node | Edge | null>(null);

  @HostListener('pointerleave', ['$event'])
  onPointerLeave(event: PointerEvent) {
    this.eventMapperService.emit({
      type: 'pointerleave',
      target: this.eventTarget(),
      pressure: event.pressure,
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY,
    });
  }
}
