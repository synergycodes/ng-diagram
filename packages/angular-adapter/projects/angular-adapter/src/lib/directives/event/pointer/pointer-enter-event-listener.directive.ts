import { Directive, HostListener, inject, input } from '@angular/core';
import { Edge, Node } from '@angularflow/core';

import { EventService } from '../../../services';
import { ITargetedEventListener } from '../../../types';

@Directive({
  selector: '[angularAdapterPointerEnterEventListener]',
})
export class PointerEnterEventListenerDirective implements ITargetedEventListener {
  private readonly eventService = inject(EventService);

  eventTarget = input<Node | Edge | null>(null);

  @HostListener('pointerenter', ['$event'])
  onPointerEnter(event: PointerEvent) {
    this.eventService.handle({ type: 'pointerenter', event, target: this.eventTarget() });
  }
}
