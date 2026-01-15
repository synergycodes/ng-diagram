import { Directive, inject } from '@angular/core';
import { FlowCoreProviderService } from '../../../services';
import { BoxSelectionProviderService } from '../../../services/box-selection-provider/box-selection-provider.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { TouchEventsStateService } from '../../../services/touch-events-state-service/touch-events-state-service.service';
import { DiagramEventName } from '../../../types';

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
  private readonly touchEventsStateService = inject(TouchEventsStateService);

  private touchStartPoint: TouchStartPoint = null;
  private isBoxSelectionActive = false;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly LONG_PRESS_DELAY = 400; // ms
  private readonly MOVE_THRESHOLD = 10; // pixels

  onTouchStart(event: TouchEvent): void {
    if (
      !this.isSingleTouch(event) ||
      this.touchEventsStateService.rotateHandled() ||
      this.touchEventsStateService.resizeHandled() ||
      this.touchEventsStateService.linkingHandled()
    ) {
      this.cancelBoxSelection();
      return;
    }

    this.touchStartPoint = { x: event.touches[0].clientX, y: event.touches[0].clientY };

    this.longPressTimer = setTimeout(() => {
      this.isBoxSelectionActive = true;
      this.touchEventsStateService.currentEvent.set(DiagramEventName.BoxSelection);
      const touch = event.touches[0] || this.touchStartPoint;
      if (touch) {
        this.emitBoxSelectionEvent('start', event, touch);
      }
    }, this.LONG_PRESS_DELAY);

    event.preventDefault();
    event.stopPropagation();
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isSingleTouch(event) || this.shouldCancelDuringLongPress(event)) {
      this.cancelBoxSelection();
      return;
    }

    if (!this.isBoxSelectionActive || !this.touchStartPoint) {
      return;
    }

    const touch = event.touches[0];
    this.emitBoxSelectionEvent('continue', event, touch);
    this.updateBoundingBox(touch);

    event.preventDefault();
    event.stopPropagation();
  }

  onTouchEnd(event: TouchEvent): void {
    this.clearLongPressTimer();

    if (!this.isBoxSelectionActive) {
      this.touchStartPoint = null;
      return;
    }

    const touch = event.changedTouches[0] || event.touches[0] || this.touchStartPoint;
    if (touch) {
      this.emitBoxSelectionEvent('end', event, touch);
    }
    this.touchEventsStateService.clearCurrentEvent();
    this.cancelBoxSelection();
    event.preventDefault();
    event.stopPropagation();
  }

  private cancelBoxSelection(): void {
    this.isBoxSelectionActive = false;
    this.touchStartPoint = null;
    this.boxSelectionProvider.boundingBox.set(null);
    this.clearLongPressTimer();
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private isSingleTouch(event: TouchEvent): boolean {
    return event.touches.length === 1;
  }

  private shouldCancelDuringLongPress(event: TouchEvent): boolean {
    if (!this.longPressTimer || !this.touchStartPoint || this.isBoxSelectionActive) {
      return false;
    }

    const touch = event.touches[0];
    const movedDistance = Math.max(
      Math.abs(touch.clientX - this.touchStartPoint.x),
      Math.abs(touch.clientY - this.touchStartPoint.y)
    );
    return movedDistance > this.MOVE_THRESHOLD;
  }

  private emitBoxSelectionEvent(
    phase: 'start' | 'continue' | 'end',
    event: TouchEvent,
    touch: Touch | TouchStartPoint
  ): void {
    if (!touch) {
      return;
    }

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    const clientX = 'clientX' in touch ? touch.clientX : touch.x;
    const clientY = 'clientY' in touch ? touch.clientY : touch.y;

    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'boxSelection',
      phase,
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: { x: clientX, y: clientY },
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
