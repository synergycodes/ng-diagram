import { Directive, ElementRef, inject, type OnDestroy } from '@angular/core';
import { NgDiagramService } from '../../../public-services/ng-diagram.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import type { PointerInputEvent } from '../../../types/event';
import { shouldDiscardEvent } from '../utils/should-discard-event';

@Directive({
  selector: '[ngDiagramPanning]',
  standalone: true,
  host: {
    '(pointerdown)': 'onPointerDown($event)',
    '(wheel)': 'onWheel($event)',
  },
})
export class PanningDirective implements OnDestroy {
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly elementRef = inject(ElementRef);
  private readonly diagramService = inject(NgDiagramService);

  ngOnDestroy(): void {
    document.removeEventListener('pointermove', this.onMouseMove);
    document.removeEventListener('pointerup', this.onPointerUp);
  }

  onPointerDown(event: PointerInputEvent): void {
    // ignore on mobile touch devices
    if (event.pointerType === 'touch') {
      return;
    }
    if (!this.inputEventsRouter.eventGuards.withPrimaryButton(event) || !this.shouldHandle(event)) {
      return;
    }
    this.toggleGrabbingCursor(true);

    event.preventDefault();
    event.stopPropagation();

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'panning',
      phase: 'start',
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });

    document.addEventListener('pointermove', this.onMouseMove);
    document.addEventListener('pointerup', this.onPointerUp);
  }

  onPointerUp = (event: PointerEvent): void => {
    if (!this.inputEventsRouter.eventGuards.withPrimaryButton(event)) {
      return;
    }
    this.toggleGrabbingCursor(false);

    event.preventDefault();
    event.stopPropagation();

    this.finishPanning(event);
  };

  onWheel(event: WheelEvent): void {
    if (!this.shouldHandleWheel(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // Calculate deltas for panning direction
    const deltaX = event.shiftKey ? event.deltaY : event.deltaX;
    const deltaY = event.shiftKey ? 0 : event.deltaY;

    const direction =
      Math.abs(deltaX) > Math.abs(deltaY) ? (deltaX > 0 ? 'left' : 'right') : deltaY > 0 ? 'top' : 'bottom';

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'keyboardPanning',
      direction,
    });
  }

  private shouldHandleWheel(event: WheelEvent): boolean {
    const { viewportPanningEnabled } = this.diagramService.config();
    return (
      !!viewportPanningEnabled &&
      !shouldDiscardEvent(event, 'pan') &&
      !this.inputEventsRouter.eventGuards.withPrimaryModifier(event)
    );
  }

  private onMouseMove = (event: PointerInputEvent) => {
    if (event.zoomingHandled) {
      this.finishPanning(event);
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'panning',
      phase: 'continue',
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  };

  private finishPanning(event: PointerInputEvent): void {
    document.removeEventListener('pointermove', this.onMouseMove);
    document.removeEventListener('pointerup', this.onPointerUp);

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'panning',
      phase: 'end',
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  }

  private shouldHandle(event: PointerInputEvent): boolean {
    const { viewportPanningEnabled } = this.diagramService.config();
    if (!viewportPanningEnabled || shouldDiscardEvent(event, 'pan')) {
      return false;
    }

    return !(
      event.moveSelectionHandled ||
      event.zoomingHandled ||
      event.linkingHandled ||
      event.rotateHandled ||
      event.boxSelectionHandled ||
      event.zoomingHandled
    );
  }

  private toggleGrabbingCursor(isGrabbing: boolean): void {
    const diagramElement = this.elementRef.nativeElement;
    diagramElement.classList.toggle('panning', isGrabbing);
  }
}
