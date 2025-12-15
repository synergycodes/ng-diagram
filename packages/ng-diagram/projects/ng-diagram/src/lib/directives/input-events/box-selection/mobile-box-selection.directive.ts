import { Directive, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';
import { FlowCoreProviderService } from '../../../services';
import { BoxSelectionProviderService } from '../../../services/box-selection-provider/box-selection-provider.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { TouchInputEvent } from '../../../types';

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
export class MobileBoxSelectionDirective implements OnDestroy, OnInit {
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly boxSelectionProvider = inject(BoxSelectionProviderService);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly elementRef = inject(ElementRef);

  /**
   * Stores the initial touch point when box selection starts.
   * Used to calculate the bounding box during selection.
   */
  private touchStartPoint: { x: number; y: number } | null = null;
  private isBoxSelectionActive = false;
  /**
   * Timer identifier for detecting long-press gesture on touch devices.
   * Used to initiate box selection after a delay.
   */
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly LONG_PRESS_DELAY = 400; // ms

  ngOnInit() {
    this.elementRef.nativeElement.addEventListener('touchstart', this.onTouchStartCapture, { capture: true });
  }

  ngOnDestroy(): void {
    this.elementRef.nativeElement.removeEventListener('touchstart', this.onTouchStartCapture, { capture: true });
    this.boxSelectionProvider.boundingBox.set(null);
    this.clearLongPressTimer();
  }

  private onTouchStartCapture = (event: TouchInputEvent): void => {
    if (event.touches.length !== 1 || !this.shouldHandle(event)) {
      return;
    }
    event.boxSelectionHandled = true;
  };

  onTouchStart(event: TouchInputEvent): void {
    if (event.touches.length !== 1) {
      this.isBoxSelectionActive = false;
      this.clearLongPressTimer();
      return;
    }
    this.isBoxSelectionActive = false;
    this.touchStartPoint = { x: event.touches[0].clientX, y: event.touches[0].clientY };

    this.clearLongPressTimer();
    this.longPressTimer = setTimeout(() => {
      this.isBoxSelectionActive = true;
      const touch = event.touches[0] || this.touchStartPoint;
      if (!touch) return;
      const baseEvent = this.inputEventsRouter.getBaseEvent(event);
      this.inputEventsRouter.emit({
        ...baseEvent,
        name: 'boxSelection',
        phase: 'start',
        target: undefined,
        targetType: 'diagram',
        lastInputPoint: { x: touch.clientX, y: touch.clientY },
      });
    }, this.LONG_PRESS_DELAY);

    event.preventDefault();
    event.stopPropagation();
  }

  onTouchMove(event: TouchInputEvent): void {
    // Jeśli użytkownik ruszył palcem przed longpress, anuluj
    if (!this.isBoxSelectionActive && this.longPressTimer && event.touches.length === 1 && this.touchStartPoint) {
      const touch = event.touches[0];
      if (
        Math.abs(touch.clientX - this.touchStartPoint.x) > 10 ||
        Math.abs(touch.clientY - this.touchStartPoint.y) > 10
      ) {
        this.clearLongPressTimer();
        this.touchStartPoint = null;
      }
      return;
    }

    if (!this.isBoxSelectionActive || event.touches.length !== 1 || !this.touchStartPoint) {
      return;
    }
    const touch = event.touches[0];

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'boxSelection',
      phase: 'continue',
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: { x: touch.clientX, y: touch.clientY },
    });

    const flowCore = this.flowCoreProvider.provide();
    const { x: startX, y: startY } = flowCore.clientToFlowViewportPosition(this.touchStartPoint);
    const { x: endX, y: endY } = flowCore.clientToFlowViewportPosition({ x: touch.clientX, y: touch.clientY });

    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    this.boxSelectionProvider.boundingBox.set({
      x,
      y,
      width,
      height,
    });

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
    if (!touch) return;

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'boxSelection',
      phase: 'end',
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: { x: touch.clientX, y: touch.clientY },
    });

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

  private shouldHandle(event: TouchInputEvent): boolean {
    const flowCore = this.flowCoreProvider.provide();
    const modifiers = this.inputEventsRouter.getBaseEvent(event).modifiers;

    return flowCore.shortcutManager.matchesAction('boxSelection', { modifiers });
  }
}
