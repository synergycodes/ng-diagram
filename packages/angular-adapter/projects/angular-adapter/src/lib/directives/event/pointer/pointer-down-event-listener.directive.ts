import { Directive, HostListener, inject, input } from '@angular/core';
import { Edge, Node } from '@angularflow/core';

import { EventService } from '../../../services';
import { ITargetedEventListener } from '../../../types';

@Directive({
  selector: '[angularAdapterPointerDownEventListener]',
})
export class PointerDownEventListenerDirective implements ITargetedEventListener {
  private readonly eventService = inject(EventService);

  eventTarget = input<Node | Edge | null>(null);

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent) {
    this.eventService.handle({ type: 'pointerdown', event, target: this.eventTarget() });
  }
}
