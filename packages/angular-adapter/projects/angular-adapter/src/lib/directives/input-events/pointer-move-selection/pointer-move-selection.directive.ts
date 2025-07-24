import { Directive, inject, input } from '@angular/core';
import { Node } from '@angularflow/core';
import { BrowserInputsHelpers } from '../../../services/input-events/browser-inputs-helpers';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PointerInputEvent } from '../../../types/event';

@Directive({
  selector: '[angularAdapterPointerMoveSelection]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class PointerMoveSelectionDirective {
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  targetData = input.required<Node>();

  onPointerDown(event: PointerInputEvent): void {
    if (this.isHandled(event)) {
      return;
    }

    if (!BrowserInputsHelpers.withPrimaryButton(event)) {
      return;
    }

    event.moveSelectionHandled = true;

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'pointerMoveSelection',
      phase: 'start',
      target: this.targetData(),
      targetType: 'node',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
  }

  onPointerUp = (event: PointerEvent): void => {
    if (!BrowserInputsHelpers.withPrimaryButton(event)) {
      return;
    }

    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'pointerMoveSelection',
      phase: 'end',
      target: this.targetData(),
      targetType: 'node',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  };

  private onPointerMove = (event: PointerInputEvent) => {
    if (this.isHandled(event)) {
      return;
    }

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'pointerMoveSelection',
      phase: 'continue',
      target: this.targetData(),
      targetType: 'node',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  };

  private isHandled(event: PointerInputEvent): boolean {
    return !!(event.zoomingHandled || event.linkingHandled || event.rotateHandled);
  }
}
