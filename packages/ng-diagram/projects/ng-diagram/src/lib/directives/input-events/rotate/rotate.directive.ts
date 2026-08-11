import { Directive, inject, input, OnDestroy } from '@angular/core';
import { Node, Point } from '../../../../core/src';
import { FlowCoreProviderService } from '../../../services';
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
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private gestureActive = false;
  // Last point this gesture actually produced — takeover and pointercancel ends
  // must not use the triggering event's coordinates (foreign finger / unreliable).
  private lastGesturePoint: Point | null = null;

  targetData = input<Node>();

  private unregisterInteractionCleanup: (() => void) | null = null;

  ngOnDestroy() {
    const wasMidGesture = this.gestureActive;
    this.removeListeners();
    // Destroyed mid-gesture (e.g. the node was deleted while rotating): the pointerup
    // will never be routed, so the rotation state must be cleared here.
    if (wasMidGesture && this.flowCoreProvider.isInitialized()) {
      this.flowCoreProvider.provide().actionStateManager.clearRotation();
    }
  }

  onPointerDown($event: PointerInputEvent) {
    // Re-entry guard: a second pointerdown mid-gesture would orphan the previous interaction-cleanup registration.
    if (this.gestureActive || !this.shouldHandle($event)) {
      return;
    }

    const targetData = this.targetData();
    if (!targetData) {
      return;
    }

    $event.rotateHandled = true;
    this.gestureActive = true;
    this.lastGesturePoint = { x: $event.clientX, y: $event.clientY };
    this.touchEventsStateService.currentEvent.set(DiagramEventName.Rotate);

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
    this.unregisterInteractionCleanup = this.flowCoreProvider
      .provide()
      .registerInteractionCleanup(() => this.removeListeners());
  }

  onPointerMove = ($event: PointerInputEvent) => {
    if (this.touchEventsStateService.panningHandled() || this.touchEventsStateService.zoomingHandled()) {
      // Takeover by another touch gesture: this move may come from the other
      // finger — end with the gesture's own last point, not this event's.
      this.endGesture($event, this.lastGesturePoint);
      return;
    }

    $event.rotateHandled = true;

    const targetData = this.targetData();
    if (!targetData) {
      return;
    }

    this.lastGesturePoint = { x: $event.clientX, y: $event.clientY };
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
    this.endGesture($event);
  };

  private endGesture($event: PointerInputEvent, lastPoint: Point | null = null): void {
    this.removeListeners();

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
      lastInputPoint: lastPoint ?? { x: $event.clientX, y: $event.clientY },
      center: this.getNodeCenter(targetData),
    });
  }

  onPointerCancel = ($event: PointerInputEvent) => {
    // pointercancel coordinates are unreliable — end with the gesture's own last point.
    this.endGesture($event, this.lastGesturePoint);
  };

  private shouldHandle(event: PointerInputEvent) {
    return !(
      event.boxSelectionHandled ||
      this.touchEventsStateService.panningHandled() ||
      this.touchEventsStateService.zoomingHandled()
    );
  }

  private removeListeners() {
    this.unregisterInteractionCleanup?.();
    this.unregisterInteractionCleanup = null;
    // The shared marker keeps concurrent gestures out (panningHandled() etc.), so
    // only its writer may clear it. gestureActive marks that writer — set only by
    // this instance's own pointerdown, so a bystander's destroy skips the clear.
    if (this.gestureActive) {
      this.gestureActive = false;
      this.touchEventsStateService.clearCurrentEvent();
    }
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
