import { Directive, inject, OnDestroy } from '@angular/core';
import { BrowserInputsHelpers } from '../../../services/input-events/browser-inputs-helpers';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PointerInputEvent } from '../../../types/event';
import { shouldDiscardEvent } from '../utils/should-discard-event';
import { ZoomingPointerDirective } from '../zooming/zooming-pointer.directive';

@Directive({
  selector: '[ngDiagramPanning]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
  },
})
export class PanningDirective implements OnDestroy {
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  ngOnDestroy(): void {
    document.removeEventListener('pointermove', this.onMouseMove);
  }

  onPointerDown(event: PointerInputEvent): void {
    if (!BrowserInputsHelpers.withPrimaryButton(event) || !this.shouldHandle(event)) {
      return;
    }

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
  }

  onPointerUp(event: PointerEvent): void {
    if (!BrowserInputsHelpers.withPrimaryButton(event)) {
      return;
    }

    document.removeEventListener('pointermove', this.onMouseMove);

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

  private onMouseMove = (event: PointerInputEvent) => {
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

  private shouldHandle(event: PointerInputEvent): boolean {
    if (shouldDiscardEvent(event, 'pan')) {
      return false;
    }

    if (ZoomingPointerDirective.IsZoomingPointer) {
      return true;
    }

    return !(event.moveSelectionHandled || event.zoomingHandled || event.linkingHandled || event.rotateHandled);
  }
}
