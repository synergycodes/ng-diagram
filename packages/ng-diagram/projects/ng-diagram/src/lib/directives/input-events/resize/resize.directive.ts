import { Directive, inject, input, OnDestroy } from '@angular/core';
import { Node, ResizeDirection } from '../../../../core/src';

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
    // The shared touch marker belongs to whichever gesture set it — a bystander
    // destroyed mid-gesture (virtualization during touch panning) must leave it alone.
    if (this.gestureActive) {
      this.gestureActive = false;
      this.touchEventsStateService.clearCurrentEvent();
    }
  }

  onPointerUp = (event: PointerEvent) => {
    this.removeListeners();

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'resize',
      phase: 'end',
      target: this.targetData(),
      direction: this.direction(),
      targetType: 'node',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  };

  onPointerMove = (event: PointerEvent): void => {
    if (this.touchEventsStateService.panningHandled() || this.touchEventsStateService.zoomingHandled()) {
      this.onPointerUp(event);
      return;
    }

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
