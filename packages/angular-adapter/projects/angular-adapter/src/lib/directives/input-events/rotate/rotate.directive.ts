import { Directive, inject, input, OnDestroy } from '@angular/core';
import { Node } from '@angularflow/core';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PointerInputEvent } from '../../../types';

@Directive({
  selector: '[ngDiagramRotateHandle]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class RotateHandleDirective implements OnDestroy {
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  targetData = input.required<Node>();

  ngOnDestroy() {
    this.cleanup();
  }

  onPointerDown($event: PointerInputEvent) {
    $event.rotateHandled = true;

    const baseEvent = this.inputEventsRouter.getBaseEvent($event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'rotate',
      phase: 'start',
      target: this.targetData(),
      lastInputPoint: {
        x: $event.clientX,
        y: $event.clientY,
      },
      center: this.getNodeCenter(),
    });

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
    document.addEventListener('pointercancel', this.onPointerCancel);
  }

  onPointerMove = ($event: PointerInputEvent) => {
    $event.rotateHandled = true;

    const baseEvent = this.inputEventsRouter.getBaseEvent($event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'rotate',
      phase: 'continue',
      target: this.targetData(),
      lastInputPoint: {
        x: $event.clientX,
        y: $event.clientY,
      },
      center: this.getNodeCenter(),
    });
  };

  onPointerUp = ($event: PointerInputEvent) => {
    const baseEvent = this.inputEventsRouter.getBaseEvent($event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'rotate',
      phase: 'end',
      target: this.targetData(),
      lastInputPoint: {
        x: $event.clientX,
        y: $event.clientY,
      },
      center: this.getNodeCenter(),
    });
    this.cleanup();
  };

  onPointerCancel = ($event: PointerInputEvent) => {
    const baseEvent = this.inputEventsRouter.getBaseEvent($event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'rotate',
      phase: 'end',
      target: this.targetData(),
      lastInputPoint: {
        x: $event.clientX,
        y: $event.clientY,
      },
      center: this.getNodeCenter(),
    });
    this.cleanup();
  };

  private cleanup() {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    document.removeEventListener('pointercancel', this.onPointerCancel);
  }

  private getNodeCenter() {
    const { x, y } = this.targetData().position;
    const { width, height } = this.targetData().size || { width: 0, height: 0 };

    return {
      x: x + width / 2,
      y: y + height / 2,
    };
  }
}
