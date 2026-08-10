import { Directive, inject, input, OnDestroy } from '@angular/core';
import { Node, Point, ResizeDirection } from '../../../../core/src';

import { FlowCoreProviderService } from '../../../services';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { TouchEventsStateService } from '../../../services/touch-events-state-service/touch-events-state-service.service';
import { DiagramEventName, type PointerInputEvent } from '../../../types/pointer-event';

@Directive({
  selector: '[ngDiagramResize]',
  standalone: true,
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class ResizeDirective implements OnDestroy {
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly touchEventsStateService = inject(TouchEventsStateService);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private gestureActive = false;
  // Last point this gesture actually produced — a takeover end must not use the
  // triggering event's coordinates (they may belong to a different finger).
  private lastGesturePoint: Point | null = null;
  direction = input.required<ResizeDirection>();
  targetData = input.required<Node>();

  private unregisterInteractionCleanup: (() => void) | null = null;

  ngOnDestroy() {
    const wasMidGesture = this.gestureActive;
    this.removeListeners();
    // Destroyed mid-gesture (e.g. the node was deleted while resizing): the pointerup
    // will never be routed, so the resize state must be cleared here — a leaked
    // resize state suppresses every subsequent node size measurement.
    if (wasMidGesture && this.flowCoreProvider.isInitialized()) {
      this.flowCoreProvider.provide().actionStateManager.clearResize();
    }
  }
  onPointerDown(event: PointerInputEvent): void {
    // Re-entry guard: a second pointerdown mid-gesture would orphan the previous interaction-cleanup registration.
    if (this.gestureActive || !this.shouldHandle(event)) {
      return;
    }

    this.gestureActive = true;
    this.lastGesturePoint = { x: event.clientX, y: event.clientY };
    this.touchEventsStateService.currentEvent.set(DiagramEventName.Resize);

    event.preventDefault();
    event.stopPropagation();

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
    this.unregisterInteractionCleanup = this.flowCoreProvider
      .provide()
      .registerInteractionCleanup(() => this.removeListeners());

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'resize',
      phase: 'start',
      target: this.targetData(),
      direction: this.direction(),
      targetType: 'node',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  }

  private removeListeners(): void {
    this.unregisterInteractionCleanup?.();
    this.unregisterInteractionCleanup = null;
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    // The shared marker keeps concurrent gestures out (panningHandled() etc.), so
    // only its writer may clear it. gestureActive marks that writer — set only by
    // this instance's own pointerdown, so a bystander's destroy skips the clear.
    if (this.gestureActive) {
      this.gestureActive = false;
      this.touchEventsStateService.clearCurrentEvent();
    }
  }

  onPointerUp = (event: PointerEvent) => {
    this.endGesture(event);
  };

  private endGesture(event: PointerEvent, lastPoint: Point | null = null): void {
    this.removeListeners();

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'resize',
      phase: 'end',
      target: this.targetData(),
      direction: this.direction(),
      targetType: 'node',
      lastInputPoint: lastPoint ?? { x: event.clientX, y: event.clientY },
    });
  }

  onPointerMove = (event: PointerEvent): void => {
    if (this.touchEventsStateService.panningHandled() || this.touchEventsStateService.zoomingHandled()) {
      // Takeover by another touch gesture: this move may come from the other
      // finger — end with the gesture's own last point, not this event's.
      this.endGesture(event, this.lastGesturePoint);
      return;
    }

    this.lastGesturePoint = { x: event.clientX, y: event.clientY };
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'resize',
      phase: 'continue',
      target: this.targetData(),
      direction: this.direction(),
      targetType: 'node',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  };

  private shouldHandle(event: PointerInputEvent) {
    return !(
      event.boxSelectionHandled ||
      this.touchEventsStateService.panningHandled() ||
      this.touchEventsStateService.zoomingHandled()
    );
  }
}
