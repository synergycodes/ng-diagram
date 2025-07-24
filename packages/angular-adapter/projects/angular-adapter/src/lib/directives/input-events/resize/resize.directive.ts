import { Directive, inject, input } from '@angular/core';
import { Node, ResizeDirection } from '@angularflow/core';

import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';

@Directive({
  selector: '[angularAdapterResize]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class ResizeDirective {
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  direction = input.required<ResizeDirection>();
  targetData = input.required<Node>();

  onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'resize',
      phase: 'start',
      target: this.targetData(),
      direction: this.direction(),
      targetType: 'node',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  }

  onPointerUp = (event: PointerEvent) => {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'resize',
      phase: 'end',
      target: this.targetData(),
      direction: this.direction(),
      targetType: 'node',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  };

  onPointerMove = (event: PointerEvent): void => {
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'resize',
      phase: 'continue',
      target: this.targetData(),
      direction: this.direction(),
      targetType: 'node',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  };
}
