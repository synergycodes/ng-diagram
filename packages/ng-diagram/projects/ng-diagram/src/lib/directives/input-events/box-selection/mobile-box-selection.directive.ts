import { Directive, inject } from '@angular/core';
import { FlowCoreProviderService } from '../../../services';
import { BoxSelectionProviderService } from '../../../services/box-selection-provider/box-selection-provider.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { TouchInputEvent } from '../../../types';

type TouchStartPoint = { x: number; y: number } | null;

@Directive({
  selector: '[ngDiagramMobileBoxSelection]',
  standalone: true,
  host: {
    '(touchstart)': 'onTouchStart($event)',
    '(touchmove)': 'onTouchMove($event)',
    '(touchend)': 'onTouchEnd($event)',
    '(touchcancel)': 'onTouchEnd($event)',
  },
})
export class MobileBoxSelectionDirective {
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly boxSelectionProvider = inject(BoxSelectionProviderService);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  private touchStartPoint: TouchStartPoint = null;
  private isBoxSelectionActive = false;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly LONG_PRESS_DELAY = 400; // ms

  onTouchStart(event: TouchInputEvent): void {
    if (!this.isSingleTouch(event)) {
      this.isBoxSelectionActive = false;
      this.touchStartPoint = null;
      this.boxSelectionProvider.boundingBox.set(null);
      this.clearLongPressTimer();
      return;
    }
    this.isBoxSelectionActive = false;
    this.touchStartPoint = { x: event.touches[0].clientX, y: event.touches[0].clientY };

    this.clearLongPressTimer();
    this.longPressTimer = setTimeout(() => {
      this.isBoxSelectionActive = true;
      const touch = event.touches[0] || this.touchStartPoint;
      if (!touch) {
        return;
      }

      this.emitBoxSelectionEvent('start', event, touch);
    }, this.LONG_PRESS_DELAY);

    event.preventDefault();
    event.stopPropagation();
  }

  onTouchMove(event: TouchInputEvent): void {
    if (this.shouldCancelBoxSelection(event)) {
      this.isBoxSelectionActive = false;
      this.touchStartPoint = null;
      this.boxSelectionProvider.boundingBox.set(null);
      this.clearLongPressTimer();
      return;
    }

    if (!this.shouldContinueBoxSelection(event)) {
      return;
    }

    const touch = event.touches[0];
    this.emitBoxSelectionEvent('continue', event, touch);
    this.updateBoundingBox(touch);

    event.preventDefault();
    event.stopPropagation();
  }

  onTouchEnd(event: TouchInputEvent): void {
    this.clearLongPressTimer();

    if (!this.isBoxSelectionActive) {
      this.touchStartPoint = null;
      return;
    }
    this.isBoxSelectionActive = false;

    const touch = event.changedTouches[0] || event.touches[0] || this.touchStartPoint;
    if (!touch) {
      return;
    }

    this.emitBoxSelectionEvent('end', event, touch);
    this.touchStartPoint = null;
    this.boxSelectionProvider.boundingBox.set(null);

    event.preventDefault();
    event.stopPropagation();
  }

  private clearLongPressTimer() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private isSingleTouch(event: TouchInputEvent): boolean {
    return event.touches.length === 1;
  }

  private shouldCancelBoxSelection(event: TouchInputEvent): boolean {
    if (!this.isSingleTouch(event)) {
      return true;
    }

    if (!this.isBoxSelectionActive && this.longPressTimer && this.touchStartPoint) {
      const touch = event.touches[0];
      return (
        Math.abs(touch.clientX - this.touchStartPoint.x) > 10 || Math.abs(touch.clientY - this.touchStartPoint.y) > 10
      );
    }
    return false;
  }

  private shouldContinueBoxSelection(event: TouchInputEvent): boolean {
    return this.isBoxSelectionActive && this.isSingleTouch(event) && !!this.touchStartPoint;
  }

  private emitBoxSelectionEvent(
    phase: 'start' | 'continue' | 'end',
    event: TouchInputEvent,
    touch: Touch | TouchStartPoint
  ): void {
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    if (!touch) {
      return;
    }

    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'boxSelection',
      phase,
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: {
        x: (touch as Touch).clientX ?? (touch as TouchStartPoint)?.x,
        y: (touch as Touch).clientY ?? (touch as TouchStartPoint)?.y,
      },
    });
  }

  private updateBoundingBox(touch: Touch): void {
    const flowCore = this.flowCoreProvider.provide();
    const { x: startX, y: startY } = flowCore.clientToFlowViewportPosition(this.touchStartPoint!);
    const { x: endX, y: endY } = flowCore.clientToFlowViewportPosition({ x: touch.clientX, y: touch.clientY });
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    this.boxSelectionProvider.boundingBox.set({ x, y, width, height });
  }
}
