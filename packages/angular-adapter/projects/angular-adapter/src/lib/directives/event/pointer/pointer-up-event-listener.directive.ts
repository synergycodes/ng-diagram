import { Directive, HostListener, inject, input } from '@angular/core';
import { Edge, Node } from '@angularflow/core';

import { EventMapperService } from '../../../services';
import { ITargetedEventListener } from '../../../types';

@Directive({
  selector: '[angularAdapterPointerUpEventListener]',
})
export class PointerUpEventListenerDirective implements ITargetedEventListener {
  private readonly eventMapperService = inject(EventMapperService);

  eventTarget = input<Node | Edge | null>(null);

  @HostListener('pointerup', ['$event'])
  onPointerUp(event: PointerEvent) {
    this.eventMapperService.emit({
      type: 'pointerup',
      target: this.eventTarget(),
      pressure: event.pressure,
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY,
    });
  }
}
