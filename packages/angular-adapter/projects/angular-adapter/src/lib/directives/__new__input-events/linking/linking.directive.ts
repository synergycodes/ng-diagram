import { Directive, inject, input } from '@angular/core';
import { Node } from '@angularflow/core';
import { AngularAdapterDiagramComponent } from '../../../components/diagram/angular-adapter-diagram.component';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PointerInputEvent } from '../../../types';

@Directive({
  selector: '[angularAdapterLinkingInput]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
    // '(pointerup)': 'onPointerUp($event)',
    // '(pointermove)': 'onPointerMove($event)',
  },
})
export class LinkingInputDirective {
  private readonly diagramComponent = inject(AngularAdapterDiagramComponent);
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  target = input.required<Node>();
  portId = input.required<string>();

  onPointerDown($event: PointerInputEvent) {
    $event.linkingHandled = true;

    const diagramContainer = this.diagramComponent.getNativeElement();
    if (!diagramContainer) {
      throw new Error('Linking failed: AngularAdapterDiagramComponent missing ElementRef');
    }

    diagramContainer.addEventListener('pointermove', this.onPointerMove);
    diagramContainer.addEventListener('pointerup', this.onPointerUp);

    const baseEvent = this.inputEventsRouter.getBaseEvent($event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'linking',
      phase: 'start',
      target: this.target(),
      targetType: 'node',
      portId: this.portId(),
      lastInputPoint: { x: $event.clientX, y: $event.clientY },
    });
  }

  onPointerMove = ($event: PointerInputEvent) => {
    const baseEvent = this.inputEventsRouter.getBaseEvent($event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'linking',
      phase: 'continue',
      target: this.target(),
      targetType: 'node',
      portId: this.portId(),
      lastInputPoint: { x: $event.clientX, y: $event.clientY },
    });
  };

  onPointerUp = ($event: PointerInputEvent) => {
    const diagramContainer = this.diagramComponent.getNativeElement();
    if (!diagramContainer) {
      throw new Error('Linking failed: AngularAdapterDiagramComponent missing ElementRef');
    }

    const baseEvent = this.inputEventsRouter.getBaseEvent($event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'linking',
      phase: 'end',
      target: this.target(),
      targetType: 'node',
      portId: this.portId(),
      lastInputPoint: { x: $event.clientX, y: $event.clientY },
    });

    diagramContainer.removeEventListener('pointermove', this.onPointerMove);
    diagramContainer.removeEventListener('pointerup', this.onPointerUp);
  };
}
