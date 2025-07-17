import { Directive, inject, input } from '@angular/core';
import { __NEW__NEW__BasePointerInputEvent, Edge, Node } from '@angularflow/core';
import { BrowserInputsHelpers } from '../../../services/input-events/browser-inputs-helpers';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';

type PointerSelectEvent = PointerEvent & {
  selectHandled?: boolean;
};

@Directive({
  selector: '[angularAdapterObjectSelect]',
  host: { '(pointerdown)': 'onPointerDown($event)' },
})
export class ObjectSelectDirective {
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  targetData = input.required<Node | Edge | undefined>();
  targetType = input.required<__NEW__NEW__BasePointerInputEvent['targetType']>();

  onPointerDown(event: PointerSelectEvent) {
    if (!BrowserInputsHelpers.withPrimaryButton(event)) {
      return;
    }

    if (event.selectHandled) {
      return;
    }

    event.selectHandled = true;

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'select',
      target: this.targetData(),
      targetType: this.targetType(),
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  }
}
