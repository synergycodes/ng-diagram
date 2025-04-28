import { Directive, HostListener, inject, input } from '@angular/core';
import { Edge, Node } from '@angularflow/core';

import { EventService } from '../../../services';
import { ITargetedEventListener } from '../../../types';

@Directive({
  selector: '[angularAdapterPointerUpEventListener]',
})
export class PointerUpEventListenerDirective implements ITargetedEventListener {
  private readonly eventService = inject(EventService);

  eventTarget = input<Node | Edge | null>(null);

  @HostListener('pointerup', ['$event'])
  onPointerUp(event: PointerEvent) {
    this.eventService.handle({ type: 'pointerup', event, target: this.eventTarget() });
  }
}
