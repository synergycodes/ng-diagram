import { Directive, ElementRef, inject, input, OnDestroy } from '@angular/core';
import { Node } from '@angularflow/core';
import { NgDiagramComponent } from '../../../components/diagram/ng-diagram.component';
import { FlowCoreProviderService } from '../../../services';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PointerInputEvent } from '../../../types';

@Directive({
  selector: '[ngDiagramRotateHandle]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class RotateHandleDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly diagramComponent = inject(NgDiagramComponent);
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  target = input.required<Node>();

  ngOnDestroy() {
    this.cleanup();
  }

  onPointerDown($event: PointerInputEvent) {
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
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    document.removeEventListener('pointercancel', this.onPointerCancel);
  }

  private getHandleCenter() {
    const flowCore = this.flowCoreProvider.provide();
    const { top, height, left, width } = this.elementRef.nativeElement.getBoundingClientRect();

    return flowCore.clientToFlowPosition({
      x: left + width / 2,
      y: top + height / 2,
    });
  }

  private getNodeCenter() {
    const { x, y } = this.target().position;
    const { width, height } = this.target().size || { width: 0, height: 0 };
    const { rotationCenter } = this.target();

    // Use custom rotation center if specified (normalized 0-1), otherwise default to center (0.5, 0.5)
    const centerX = rotationCenter ? rotationCenter.x : 0.5;
    const centerY = rotationCenter ? rotationCenter.y : 0.5;

    return {
      x: x + width * centerX,
      y: y + height * centerY,
    };
  }
}
