import { Directive, inject } from '@angular/core';
import { NgDiagramService } from '../../../public-services/ng-diagram.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { TouchEventsStateService } from '../../../services/touch-events-state-service/touch-events-state-service.service';
import { DiagramEventName } from '../../../types';
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
  private readonly touchEventsStateService = inject(TouchEventsStateService);

  private isPanning = false;
  /**
   * Stores the last touch point during a panning gesture.
   * Used to emit the last input point on touch end.
   */
  private lastTouch: { x: number; y: number } | null = null;

  onTouchStart(event: TouchEvent): void {
    // Check if zooming is already active before starting panning
    if (!this.isTwoFingerTouch(event) || !this.shouldHandle(event) || this.touchEventsStateService.zoomingHandled()) {
      this.isPanning = false;
      return;
    }
    this.isPanning = true;
    this.touchEventsStateService.currentEvent.set(DiagramEventName.Panning);

    const midpoint = this.getMidpoint(event.touches);
    this.lastTouch = midpoint;
    this.emitPanningEvent('start', event, midpoint);
    this.preventDefaultAndStop(event);
  }

  onTouchMove(event: TouchEvent): void {
    // If zooming starts during panning, stop panning immediately
    if (this.touchEventsStateService.zoomingHandled() && this.isPanning) {
      this.isPanning = false;
      this.lastTouch = null;
      this.touchEventsStateService.clearCurrentEvent();
      return;
    }

    if (!this.shouldContinuePanning(event)) {
      return;
    }

    const midpoint = this.getMidpoint(event.touches);
    this.lastTouch = midpoint;
    this.emitPanningEvent('continue', event, midpoint);
    this.preventDefaultAndStop(event);
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.isPanning) {
      return;
    }
    this.isPanning = false;

    const lastPoint = this.lastTouch || this.getMidpoint(event.touches);
    this.emitPanningEvent('end', event, lastPoint);
    this.lastTouch = null;
    this.touchEventsStateService.clearCurrentEvent();
    this.preventDefaultAndStop(event);
  }

  private getMidpoint(touches: TouchList): { x: number; y: number } {
    if (touches.length < 2) {
      return { x: 0, y: 0 };
    }
    const x = (touches[0].clientX + touches[1].clientX) / 2;
    const y = (touches[0].clientY + touches[1].clientY) / 2;
    return { x, y };
  }

  private shouldHandle(event: TouchEvent): boolean {
    const { viewportPanningEnabled } = this.diagramService.config();
    if (!viewportPanningEnabled || shouldDiscardEvent(event, 'pan')) {
      return false;
    }
    return !this.touchEventsStateService.zoomingHandled();
  }

  private isTwoFingerTouch(event: TouchEvent): boolean {
    return event.touches.length === 2;
  }

  private shouldContinuePanning(event: TouchEvent): boolean {
    return this.isPanning && this.isTwoFingerTouch(event) && !this.touchEventsStateService.zoomingHandled();
  }

  private emitPanningEvent(
    phase: 'start' | 'continue' | 'end',
    event: TouchEvent,
    lastInputPoint: { x: number; y: number }
  ): void {
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'panning',
      phase,
      target: undefined,
      targetType: 'diagram',
      lastInputPoint,
    });
  }

  private preventDefaultAndStop(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }
}
