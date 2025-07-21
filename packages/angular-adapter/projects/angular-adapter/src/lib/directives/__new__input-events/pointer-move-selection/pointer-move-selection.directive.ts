import { Directive, inject, input } from '@angular/core';
import { Node } from '@angularflow/core';
import { AngularAdapterDiagramComponent } from '../../../components/diagram/angular-adapter-diagram.component';
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
  private readonly diagramComponent = inject(AngularAdapterDiagramComponent);
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  targetData = input.required<Node>();

  onPointerDown(event: PointerInputEvent): void {
    if (event.zoomingHandled) {
      return;
    }

    if (!BrowserInputsHelpers.withPrimaryButton(event)) {
      return;
    }

    const containerElement = this.diagramComponent.getNativeElement();
    if (!containerElement) {
      throw new Error('Resize failed: AngularAdapterDiagramComponent missing ElementRef');
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

    containerElement.addEventListener('pointermove', this.onPointerMove);
    containerElement.addEventListener('pointerup', this.onPointerUp);
  }

  onPointerUp = (event: PointerEvent): void => {
    if (!BrowserInputsHelpers.withPrimaryButton(event)) {
      return;
    }

    const containerElement = this.diagramComponent.getNativeElement();
    if (!containerElement) {
      throw new Error('Resize failed: AngularAdapterDiagramComponent missing ElementRef');
    }

    containerElement.removeEventListener('pointermove', this.onPointerMove);
    containerElement.removeEventListener('pointerup', this.onPointerUp);

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
    if (event.zoomingHandled) {
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
}
