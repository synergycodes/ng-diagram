import { Directive, inject, type OnDestroy } from '@angular/core';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import type { PointerInputEvent } from '../../../types/event';
import { shouldDiscardEvent } from '../utils/should-discard-event';

@Directive({
  selector: '[ngDiagramPanning]',
  standalone: true,
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class PanningDirective implements OnDestroy {
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  ngOnDestroy(): void {
    document.removeEventListener('pointermove', this.onMouseMove);
    document.removeEventListener('pointerup', this.onPointerUp);
  }

  onPointerDown(event: PointerInputEvent): void {
    if (!this.inputEventsRouter.eventGuards.withPrimaryButton(event) || !this.shouldHandle(event)) {
      return;
    }

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

    event.preventDefault();
    event.stopPropagation();

    this.finishPanning(event);
  };

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
    if (shouldDiscardEvent(event, 'pan')) {
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
}
