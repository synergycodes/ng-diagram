import { Directive, inject, input, OnDestroy, signal } from '@angular/core';
import { FPS_60, NgDiagramMath, Node, Point } from '../../../../core/src';
import { FlowCoreProviderService } from '../../../services';
import { LinkingEventService } from '../../../services/input-events/linking-event.service';
import { TouchEventsStateService } from '../../../services/touch-events-state-service/touch-events-state-service.service';
import { DiagramEventName, PointerInputEvent } from '../../../types';

@Directive({
  selector: '[ngDiagramLinkingInput]',
  standalone: true,
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
  providers: [LinkingEventService],
})
export class LinkingInputDirective implements OnDestroy {
  private readonly linkingEventService = inject(LinkingEventService);
  private readonly flowCoreProviderService = inject(FlowCoreProviderService);
  private readonly touchEventsStateService = inject(TouchEventsStateService);

  private target = signal<Node | undefined>(undefined);
  private edgePanningInterval: number | null = null;
  private unregisterInteractionCleanup: (() => void) | null = null;
  private gestureActive = false;

  portId = input.required<string>();

  ngOnDestroy(): void {
    const wasMidGesture = this.gestureActive;
    this.removeListeners();
    // Destroyed mid-gesture (e.g. the source node was deleted while linking): the
    // pointerup will never be routed and finishLinking will never run. The state
    // must be cleared here — a stranded linking state permanently disables linking,
    // because shouldHandle refuses to start while isLinking() is true.
    if (wasMidGesture && this.flowCoreProviderService.isInitialized()) {
      this.flowCoreProviderService.provide().actionStateManager.clearLinking();
    }
  }

  setTargetNode(node: Node) {
    this.target.set(node);
  }

  onPointerDown($event: PointerInputEvent) {
    // Re-entry guard: a second pointerdown mid-gesture would orphan the previous interaction-cleanup registration.
    if (this.gestureActive || !this.shouldHandle($event)) {
      return;
    }

    $event.linkingHandled = true;
    this.gestureActive = true;
    this.touchEventsStateService.currentEvent.set(DiagramEventName.Linking);

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
    this.unregisterInteractionCleanup = this.flowCoreProviderService
      .provide()
      .registerInteractionCleanup(() => this.removeListeners());

    this.linkingEventService.emitStart($event, this.target(), this.portId());
  }

  onPointerMove = ($event: PointerInputEvent) => {
    if (this.touchEventsStateService.panningHandled() || this.touchEventsStateService.zoomingHandled()) {
      // Another touch gesture claimed the pointer — this move may come from the
      // other finger, so the linking is cancelled instead of finished at its point.
      this.linkingEventService.emitEnd($event, this.target(), this.portId(), true);
      this.removeListeners();
      return;
    }

    const { edgePanningThreshold, edgePanningEnabled, edgePanningForce } =
      this.flowCoreProviderService.provide().config.linking;
    const flowCore = this.flowCoreProviderService.provide();

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
      if (panningForce) {
        this.startEdgePanning($event, panningForce);
      } else {
        this.stopEdgePanning();
      }
    }

    this.linkingEventService.emitContinue($event, this.target(), this.portId(), panningForce);
  };

  onPointerUp = ($event: PointerInputEvent) => {
    this.linkingEventService.emitEnd($event, this.target(), this.portId());
    this.removeListeners();
  };

  private shouldHandle(event: PointerInputEvent) {
    if (this.flowCoreProviderService.provide().actionStateManager.isLinking()) {
      this.target.set(undefined);
      return false;
    }

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
    this.stopEdgePanning();
  }

  private startEdgePanning($event: PointerInputEvent, panningForce: Point | null): void {
    this.stopEdgePanning();

    this.edgePanningInterval = window.setInterval(() => {
      this.linkingEventService.emitContinue($event, this.target(), this.portId(), panningForce);
    }, FPS_60);
  }

  private stopEdgePanning(): void {
    if (this.edgePanningInterval != null) {
      window.clearInterval(this.edgePanningInterval);
      this.edgePanningInterval = null;
    }
  }
}
