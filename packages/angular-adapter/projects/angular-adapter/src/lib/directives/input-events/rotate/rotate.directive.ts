import { Directive, ElementRef, inject, input } from '@angular/core';
import { Node } from '@angularflow/core';
import { AngularAdapterDiagramComponent } from '../../../components/diagram/angular-adapter-diagram.component';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PointerInputEvent } from '../../../types';

@Directive({
  selector: '[angularAdapterRotateHandle]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class RotateHandleDirective {
  private readonly elementRef = inject(ElementRef);
  private readonly diagramComponent = inject(AngularAdapterDiagramComponent);
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  target = input.required<Node>();

  onPointerDown($event: PointerInputEvent) {
    $event.rotateHandled = true;

    const diagramContainer = this.diagramComponent.getNativeElement();
    if (!diagramContainer) {
      throw new Error('Rotate handle failed: AngularAdapterDiagramComponent missing ElementRef');
    }

    const baseEvent = this.inputEventsRouter.getBaseEvent($event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'rotate',
      target: this.target(),
      lastInputPoint: {
        x: $event.clientX,
        y: $event.clientY,
      },
      handle: this.getHandleCenter(),
      center: this.getNodeCenter(),
    });

    diagramContainer.addEventListener('pointermove', this.onPointerMove);
    diagramContainer.addEventListener('pointerup', this.onPointerUp);
    diagramContainer.addEventListener('pointercancel', this.onPointerCancel);
  }

  onPointerMove = ($event: PointerInputEvent) => {
    $event.rotateHandled = true;

    const baseEvent = this.inputEventsRouter.getBaseEvent($event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'rotate',
      target: this.target(),
      lastInputPoint: {
        x: $event.clientX,
        y: $event.clientY,
      },
      handle: this.getHandleCenter(),
      center: this.getNodeCenter(),
    });
  };

  onPointerUp = () => {
    this.cleanup();
  };

  onPointerCancel = () => {
    this.cleanup();
  };

  private cleanup() {
    const diagramContainer = this.diagramComponent.getNativeElement();
    if (!diagramContainer) {
      throw new Error('Rotate handle failed: AngularAdapterDiagramComponent missing ElementRef');
    }

    diagramContainer.removeEventListener('pointermove', this.onPointerMove);
    diagramContainer.removeEventListener('pointerup', this.onPointerUp);
    diagramContainer.removeEventListener('pointercancel', this.onPointerCancel);
  }

  private getHandleCenter() {
    const { top, height, left, width } = this.elementRef.nativeElement.getBoundingClientRect();
    return {
      x: left + width / 2,
      y: top + height / 2,
    };
  }

  private getNodeCenter() {
    const { x, y } = this.target().position;
    const { width, height } = this.target().size || { width: 0, height: 0 };

    return {
      x: x + width / 2,
      y: y + height / 2,
    };
  }
}
