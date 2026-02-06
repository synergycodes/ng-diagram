import { Directive, inject, input, OnDestroy } from '@angular/core';
import { Node } from '../../../../core/src';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { TouchEventsStateService } from '../../../services/touch-events-state-service/touch-events-state-service.service';
import { DiagramEventName, PointerInputEvent } from '../../../types';

@Directive({
  selector: '[ngDiagramRotateHandle]',
  standalone: true,
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class RotateHandleDirective implements OnDestroy {
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly touchEventsStateService = inject(TouchEventsStateService);

  targetData = input<Node>();

  ngOnDestroy() {
    this.cleanup();
  }

  onPointerDown($event: PointerInputEvent) {
    if (!this.shouldHandle($event)) {
      return;
    }

    $event.rotateHandled = true;
    this.touchEventsStateService.currentEvent.set(DiagramEventName.Rotate);

    const targetData = this.targetData();
    if (!targetData) {
      return;
    }

    const baseEvent = this.inputEventsRouter.getBaseEvent($event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'rotate',
      phase: 'start',
      target: targetData,
      lastInputPoint: {
        x: $event.clientX,
        y: $event.clientY,
      },
      center: this.getNodeCenter(targetData),
    });

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
    document.addEventListener('pointercancel', this.onPointerCancel);
  }

  onPointerMove = ($event: PointerInputEvent) => {
    if (this.touchEventsStateService.panningHandled() || this.touchEventsStateService.zoomingHandled()) {
      this.onPointerUp($event);
      return;
    }

    $event.rotateHandled = true;

    const targetData = this.targetData();
    if (!targetData) {
      return;
    }

    const baseEvent = this.inputEventsRouter.getBaseEvent($event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'rotate',
      phase: 'continue',
      target: targetData,
      lastInputPoint: {
        x: $event.clientX,
        y: $event.clientY,
      },
      center: this.getNodeCenter(targetData),
    });
  };

  onPointerUp = ($event: PointerInputEvent) => {
    const targetData = this.targetData();
    if (!targetData) {
      return;
    }

    const baseEvent = this.inputEventsRouter.getBaseEvent($event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'rotate',
      phase: 'end',
      target: targetData,
      lastInputPoint: {
        x: $event.clientX,
        y: $event.clientY,
      },
      center: this.getNodeCenter(targetData),
    });
    this.cleanup();
  };

  onPointerCancel = ($event: PointerInputEvent) => {
    const targetData = this.targetData();
    if (!targetData) {
      return;
    }

    const baseEvent = this.inputEventsRouter.getBaseEvent($event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'rotate',
      phase: 'end',
      target: targetData,
      lastInputPoint: {
        x: $event.clientX,
        y: $event.clientY,
      },
      center: this.getNodeCenter(targetData),
    });
    this.cleanup();
  };

  private shouldHandle(event: PointerInputEvent) {
    return !(
      event.boxSelectionHandled ||
      this.touchEventsStateService.panningHandled() ||
      this.touchEventsStateService.zoomingHandled()
    );
  }

  private cleanup() {
    this.touchEventsStateService.clearCurrentEvent();
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    document.removeEventListener('pointercancel', this.onPointerCancel);
  }

  private getNodeCenter(targetData: Node) {
    const { x, y } = targetData.position;
    const { width, height } = targetData.size || { width: 0, height: 0 };

    return {
      x: x + width / 2,
      y: y + height / 2,
    };
  }
}
