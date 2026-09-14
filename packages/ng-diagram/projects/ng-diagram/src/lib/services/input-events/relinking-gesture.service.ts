import { inject, Injectable } from '@angular/core';
import { Edge, EdgeEnd, FPS_60, NgDiagramMath, Point } from '../../../core/src';
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
 */
@Injectable()
export class RelinkingGestureService {
  private readonly relinkingEventService = inject(RelinkingEventService);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly touchEventsStateService = inject(TouchEventsStateService);

  private edge: Edge | undefined;
  private end: EdgeEnd = 'target';
  private gestureActive = false;
  private edgePanningInterval: number | null = null;
  private lastPanningEvent: PointerInputEvent | null = null;
  private lastPanningForce: Point | null = null;
  private unregisterInteractionCleanup: (() => void) | null = null;

  /**
   * Starts dragging `end` of `edge` from the given pointerdown.
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
    if (this.touchEventsStateService.panningHandled() || this.touchEventsStateService.zoomingHandled()) {
      return false;
    }

    this.edge = edge;
    this.end = end;
    this.gestureActive = true;
    this.touchEventsStateService.currentEvent.set(DiagramEventName.Linking);

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
    this.unregisterInteractionCleanup = flowCore.registerInteractionCleanup(() => this.removeListeners());

    this.relinkingEventService.emitStart(event, edge, end);
    return true;
  }

  private onPointerMove = ($event: PointerInputEvent) => {
    if (this.touchEventsStateService.panningHandled() || this.touchEventsStateService.zoomingHandled()) {
      // Another touch gesture claimed the pointer — this move may come from the
      // other finger, so the relink is cancelled instead of finished at its point.
      this.relinkingEventService.emitEnd($event, this.edge, this.end, true);
      this.removeListeners();
      return;
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
    this.relinkingEventService.emitEnd($event, this.edge, this.end);
    this.removeListeners();
  };

  private removeListeners() {
    this.unregisterInteractionCleanup?.();
    this.unregisterInteractionCleanup = null;
    if (this.gestureActive) {
      this.gestureActive = false;
      this.touchEventsStateService.clearCurrentEvent();
    }
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
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
