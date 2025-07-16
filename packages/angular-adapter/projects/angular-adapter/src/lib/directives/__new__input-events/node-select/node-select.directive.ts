import { Directive, inject, input } from '@angular/core';
import { Node } from '@angularflow/core';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';

@Directive({
  selector: '[angularAdapterNodeSelect]',
  host: { '(pointerdown)': 'onPointerDown($event)' },
})
export class NodeSelectDirective {
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  data = input.required<Node>();

  onPointerDown(event: PointerEvent) {
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'node-select',
      target: this.data(),
    });
  }
}
