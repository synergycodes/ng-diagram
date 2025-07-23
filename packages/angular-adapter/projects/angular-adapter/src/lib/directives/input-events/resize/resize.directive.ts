import { Directive, inject, input } from '@angular/core';
import { Node, ResizeDirection } from '@angularflow/core';

import { AngularAdapterDiagramComponent } from '../../../components/diagram/angular-adapter-diagram.component';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';

@Directive({
  selector: '[angularAdapterResize]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class ResizeDirective {
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly diagramComponent = inject(AngularAdapterDiagramComponent);

  direction = input.required<ResizeDirection>();
  targetData = input.required<Node>();

  onPointerDown(event: PointerEvent): void {
    const containerElement = this.diagramComponent.getNativeElement();
    if (!containerElement) {
      throw new Error('Resize failed: AngularAdapterDiagramComponent missing ElementRef');
    }

    event.preventDefault();
    event.stopPropagation();

    containerElement.addEventListener('pointermove', this.onPointerMove);
    containerElement.addEventListener('pointerup', this.onPointerUp);

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
    const containerElement = this.diagramComponent.getNativeElement();
    if (!containerElement) {
      throw new Error('Resize failed: AngularAdapterDiagramComponent missing ElementRef');
    }

    containerElement.removeEventListener('pointermove', this.onPointerMove);
    containerElement.removeEventListener('pointerup', this.onPointerUp);

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
