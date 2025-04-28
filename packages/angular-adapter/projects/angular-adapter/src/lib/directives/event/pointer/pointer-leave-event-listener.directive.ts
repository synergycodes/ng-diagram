import { Directive, HostListener, inject, input } from '@angular/core';
import { Edge, Node } from '@angularflow/core';

import { EventService } from '../../../services';
import { ITargetedEventListener } from '../../../types';

@Directive({
  selector: '[angularAdapterPointerLeaveEventListener]',
})
export class PointerLeaveEventListenerDirective implements ITargetedEventListener {
  private readonly eventService = inject(EventService);

  eventTarget = input<Node | Edge | null>(null);

  @HostListener('pointerleave', ['$event'])
  onPointerLeave(event: PointerEvent) {
    this.eventService.handle({ type: 'pointerleave', event, target: this.eventTarget() });
  }
}
