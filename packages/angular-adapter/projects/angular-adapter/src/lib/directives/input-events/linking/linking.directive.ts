import { Directive, inject, input, signal } from '@angular/core';
import { Node } from '@angularflow/core';
import { AngularAdapterDiagramComponent } from '../../../components/diagram/angular-adapter-diagram.component';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PointerInputEvent } from '../../../types';

@Directive({
  selector: '[angularAdapterLinkingInput]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class LinkingInputDirective {
  private readonly diagramComponent = inject(AngularAdapterDiagramComponent);
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  target = signal<Node | undefined>(undefined);
  portId = input.required<string>();

  setTargetNode(node: Node) {
    this.target.set(node);
  }

  onPointerDown($event: PointerInputEvent) {
    $event.linkingHandled = true;

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);

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

    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
  };
}
