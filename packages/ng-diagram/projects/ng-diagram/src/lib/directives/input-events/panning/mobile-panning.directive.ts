import { Directive, inject } from '@angular/core';
import { NgDiagramService } from '../../../public-services/ng-diagram.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { TouchInputEvent } from '../../../types';
import { shouldDiscardEvent } from '../utils/should-discard-event';

@Directive({
  selector: '[ngDiagramPanning]',
  standalone: true,
  host: {
    '(touchstart)': 'onTouchStart($event)',
    '(touchmove)': 'onTouchMove($event)',
    '(touchend)': 'onTouchEnd($event)',
    '(touchcancel)': 'onTouchEnd($event)',
  },
})
export class MobilePanningDirective {
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly diagramService = inject(NgDiagramService);

  private isPanning = false;
  private lastTouch: { x: number; y: number } | null = null;

  onTouchStart(event: TouchInputEvent): void {
    if (event.touches.length !== 2 || !this.shouldHandle(event)) {
      this.isPanning = false;
      return;
    }
    this.isPanning = true;

    event.preventDefault();
    event.stopPropagation();

    const { x, y } = this.getMidpoint(event.touches);
    this.lastTouch = { x, y };

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'panning',
      phase: 'start',
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: { x, y },
    });
  }

  onTouchMove(event: TouchInputEvent): void {
    if (!this.isPanning || event.touches.length !== 2 || event.zoomingHandled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const { x, y } = this.getMidpoint(event.touches);
    this.lastTouch = { x, y };

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'panning',
      phase: 'continue',
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: { x, y },
    });
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.isPanning) {
      return;
    }
    this.isPanning = false;

    event.preventDefault();
    event.stopPropagation();

    const { x, y } = this.lastTouch || this.getMidpoint(event.touches);

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'panning',
      phase: 'end',
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: { x, y },
    });
    this.lastTouch = null;
  }

  private getMidpoint(touches: TouchList): { x: number; y: number } {
    if (touches.length < 2) {
      return { x: 0, y: 0 };
    }
    const x = (touches[0].clientX + touches[1].clientX) / 2;
    const y = (touches[0].clientY + touches[1].clientY) / 2;
    return { x, y };
  }

  private shouldHandle(event: TouchInputEvent): boolean {
    const { viewportPanningEnabled } = this.diagramService.config();
    if (!viewportPanningEnabled || shouldDiscardEvent(event, 'pan')) {
      return false;
    }
    return !(event.zoomingHandled || event.boxSelectionHandled);
  }
}
