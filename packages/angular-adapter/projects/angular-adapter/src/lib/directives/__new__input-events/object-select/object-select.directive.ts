import { Directive, inject, input } from '@angular/core';
import { __NEW__SelectEvent, Edge, Node } from '@angularflow/core';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';

@Directive({
  selector: '[angularAdapterObjectSelect]',
  host: { '(pointerdown)': 'onPointerDown($event)' },
})
export class ObjectSelectDirective {
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  selectTargetData = input.required<Node | Edge | undefined>();
  selectTargetType = input.required<__NEW__SelectEvent['targetType']>();

  onPointerDown(event: PointerEvent) {
    event.stopPropagation();
    event.preventDefault();

    if (!this.selectTargetType()) {
      throw new Error('targetType is required for ObjectSelectDirective');
    }

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit<__NEW__SelectEvent>({
      ...baseEvent,
      name: 'select',
      target: this.selectTargetData(),
      targetType: this.selectTargetType(),
    });
  }
}
