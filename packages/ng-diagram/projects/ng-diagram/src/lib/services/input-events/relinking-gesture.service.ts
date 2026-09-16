import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { Edge, EdgeEnd, FPS_60, NgDiagramMath, Point } from '../../../core/src';
import { MOVE_THRESHOLD } from '../../../core/src/input-events/handlers/pointer-move-selection/pointer-move-selection.handler';
import { DiagramEventName, PointerInputEvent } from '../../types';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';
import { TouchEventsStateService } from '../touch-events-state-service/touch-events-state-service.service';
import { RelinkingEventService } from './relinking-event.service';

/**
 * Drives an edge relink gesture from document-level listeners.
 *
 * The gesture cannot live on the endpoint handle element: starting a relink
 * hides the original edge from rendering, which unmounts the handle that
 * received the pointerdown. This diagram-scoped service outlives it.
 *
 * A pointerdown only registers the candidate; the relink starts once the
 * pointer travels beyond {@link MOVE_THRESHOLD} — a plain click on a handle
 * must neither detach the edge nor emit relink events.
 */
@Injectable()
export class RelinkingGestureService implements OnDestroy {
  private readonly relinkingEventService = inject(RelinkingEventService);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly touchEventsStateService = inject(TouchEventsStateService);

  private edge: Edge | undefined;
  private end: EdgeEnd = 'target';
  private pointerId: number | null = null;
  private startClientPoint: Point | null = null;
  private started = false;
  private gestureActive = false;
  private edgePanningInterval: number | null = null;
  private lastPanningEvent: PointerInputEvent | null = null;
  private lastPanningForce: Point | null = null;
  private unregisterInteractionCleanup: (() => void) | null = null;

  /**
   * True while an endpoint is actually being dragged (the movement threshold
   * was crossed). Drives the diagram host's `relinking` class so the grabbing
   * cursor survives the handle unmounting mid-gesture.
   */
  readonly active = signal(false);

  ngOnDestroy(): void {
    const wasMidGesture = this.started;
    this.removeListeners();
    // Destroyed mid-gesture (the diagram itself was torn down): the pointerup
    // will never be routed and finishRelinking will never run. Run the full
    // cancel flow so the core linking state does not stay claimed.
    if (wasMidGesture && this.flowCoreProvider.isInitialized()) {
      void this.flowCoreProvider.provide().cancelActiveInteraction();
    }
  }

  /**
   * Registers a pointerdown on an endpoint handle as a relink candidate.
   * @returns Whether the gesture was claimed.
   */
  beginRelink(event: PointerInputEvent, edge: Edge, end: EdgeEnd): boolean {
    const flowCore = this.flowCoreProvider.provide();

    // Re-entry guard — a second pointerdown mid-gesture would orphan the
    // previous interaction-cleanup registration.
    if (this.gestureActive || flowCore.actionStateManager.isLinking()) {
      return false;
    }
    if (!flowCore.config.edgeRelinking.enabled) {
      return false;
    }
    // An Escape-triggered cancel can still be rolling back state.
    if (flowCore.isCancellingInteraction()) {
      return false;
    }
    // Another gesture claimed this pointerdown (box selection runs in the
    // capture phase; panning/zooming are touch takeovers).
    if (
      event.boxSelectionHandled ||
      this.touchEventsStateService.panningHandled() ||
      this.touchEventsStateService.zoomingHandled()
    ) {
      return false;
    }

    this.edge = edge;
    this.end = end;
    this.pointerId = event.pointerId;
    this.startClientPoint = { x: event.clientX, y: event.clientY };
    this.started = false;
    this.gestureActive = true;
    this.touchEventsStateService.currentEvent.set(DiagramEventName.Linking);

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
    document.addEventListener('pointercancel', this.onPointerCancel);
    this.unregisterInteractionCleanup = flowCore.registerInteractionCleanup(() => this.removeListeners());

    return true;
  }

  private onPointerMove = ($event: PointerInputEvent) => {
    if ($event.pointerId !== this.pointerId) {
      return;
    }
    if (this.touchEventsStateService.panningHandled() || this.touchEventsStateService.zoomingHandled()) {
      // Another touch gesture claimed the pointer — this move may come from the
      // other finger, so the relink is cancelled instead of finished at its point.
      if (this.started) {
        this.relinkingEventService.emitEnd($event, this.edge, this.end, true);
      }
      this.removeListeners();
      return;
    }

    if (!this.started) {
      const start = this.startClientPoint;
      const travelled = start
        ? NgDiagramMath.distanceBetweenPoints(start, { x: $event.clientX, y: $event.clientY })
        : 0;
      if (travelled < MOVE_THRESHOLD) {
        return;
      }
      this.started = true;
      this.active.set(true);
      this.relinkingEventService.emitStart($event, this.edge, this.end);
    }

    const flowCore = this.flowCoreProvider.provide();
    const { edgePanningThreshold, edgePanningEnabled, edgePanningForce } = flowCore.config.linking;

    let panningForce: Point | null = null;
    if (edgePanningEnabled) {
      const { width, height } = flowCore.getViewport();
      const { x, y } = flowCore.getFlowOffset();
      const boundingRect = { x, y, width: width ?? 0, height: height ?? 0 };
      panningForce = NgDiagramMath.calculateEdgePanningForce(
        boundingRect,
        { x: $event.clientX, y: $event.clientY },
        edgePanningThreshold,
        edgePanningForce
      );
      // The interval reads these fields on every tick — updating them here
      // keeps auto-pan following the live pointer position and direction
      // instead of replaying the coordinates captured when panning started.
      this.lastPanningEvent = $event;
      this.lastPanningForce = panningForce;
      if (panningForce) {
        this.startEdgePanning();
      } else {
        this.stopEdgePanning();
      }
    }

    this.relinkingEventService.emitContinue($event, this.edge, this.end, panningForce);
  };

  private onPointerUp = ($event: PointerInputEvent) => {
    // Only the gesture's own pointer releasing its primary button finishes the
    // relink — a second finger's tap or a right-button release must not commit
    // at its coordinates.
    if ($event.pointerId !== this.pointerId || $event.button !== 0) {
      return;
    }
    const takenOver = this.touchEventsStateService.panningHandled() || this.touchEventsStateService.zoomingHandled();
    if (this.started) {
      this.relinkingEventService.emitEnd($event, this.edge, this.end, takenOver);
    }
    this.removeListeners();
  };

  private onPointerCancel = ($event: PointerInputEvent) => {
    if ($event.pointerId !== this.pointerId) {
      return;
    }
    // A cancelled pointer carries no usable coordinates — abort the relink
    // instead of committing anything.
    if (this.started) {
      this.relinkingEventService.emitEnd($event, this.edge, this.end, true);
    }
    this.removeListeners();
  };

  private removeListeners() {
    this.unregisterInteractionCleanup?.();
    this.unregisterInteractionCleanup = null;
    if (this.gestureActive) {
      this.gestureActive = false;
      this.touchEventsStateService.clearCurrentEvent();
    }
    this.started = false;
    this.active.set(false);
    this.edge = undefined;
    this.pointerId = null;
    this.startClientPoint = null;
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    document.removeEventListener('pointercancel', this.onPointerCancel);
    this.stopEdgePanning();
  }

  private startEdgePanning(): void {
    if (this.edgePanningInterval !== null) {
      return;
    }
    this.edgePanningInterval = window.setInterval(() => {
      if (this.lastPanningEvent && this.lastPanningForce) {
        this.relinkingEventService.emitContinue(this.lastPanningEvent, this.edge, this.end, this.lastPanningForce);
      }
    }, FPS_60);
  }

  private stopEdgePanning(): void {
    if (this.edgePanningInterval !== null) {
      clearInterval(this.edgePanningInterval);
      this.edgePanningInterval = null;
    }
    this.lastPanningEvent = null;
    this.lastPanningForce = null;
  }
}
