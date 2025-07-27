import { Directive, inject, input, OnDestroy, signal } from '@angular/core';
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
export class LinkingInputDirective implements OnDestroy {
  private readonly diagramComponent = inject(AngularAdapterDiagramComponent);
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  target = signal<Node | undefined>(undefined);
  portId = input.required<string>();

  ngOnDestroy(): void {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
  }

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

  private getContainerElement(): HTMLElement {
    const containerElement = this.diagramComponent.getNativeElement();
    if (!containerElement) {
      throw new Error('Linking failed: AngularAdapterDiagramComponent missing ElementRef');
    }
    return containerElement;
  }
}
