import { Directive, inject, input, OnDestroy } from '@angular/core';
import { ContainerEdge, FPS_60, NgDiagramMath, Node } from '@angularflow/core';
import { NgDiagramComponent } from '../../../components/diagram/ng-diagram.component';
import { FlowCoreProviderService } from '../../../services';
import { BrowserInputsHelpers } from '../../../services/input-events/browser-inputs-helpers';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PointerInputEvent } from '../../../types/event';
import { shouldDiscardEvent } from '../utils/should-discard-event';

@Directive({
  selector: '[ngDiagramPointerMoveSelection]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class PointerMoveSelectionDirective implements OnDestroy {
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly diagramComponent = inject(NgDiagramComponent);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  targetData = input.required<Node>();

  private edgePanningInterval: number | null = null;
  private currentEdge: ContainerEdge = null;
  private storedDistanceFromEdge: number | undefined;

  ngOnDestroy() {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    this.stopEdgePanning();
  }

  onPointerDown(event: PointerInputEvent): void {
    if (!this.shouldHandle(event)) {
      return;
    }

    if (!BrowserInputsHelpers.withPrimaryButton(event)) {
      return;
    }

    event.moveSelectionHandled = true;

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'pointerMoveSelection',
      phase: 'start',
      target: this.targetData(),
      targetType: 'node',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
      currentDiagramEdge: null,
    });

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
  }

  onPointerUp = (event: PointerEvent): void => {
    if (!BrowserInputsHelpers.withPrimaryButton(event)) {
      return;
    }

    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    this.stopEdgePanning();

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'pointerMoveSelection',
      phase: 'end',
      target: this.targetData(),
      targetType: 'node',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
      currentDiagramEdge: null,
    });
  };

  private onPointerMove = (event: PointerInputEvent) => {
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    const screenEdge = this.getDiagramEdge(event.clientX, event.clientY);

    // Calculate distance from edge for gradual panning
    let distanceFromEdge: number | undefined;
    if (screenEdge) {
      const containerBounds = this.diagramComponent.getBoundingClientRect();
      distanceFromEdge = NgDiagramMath.calculateDistanceFromEdge(
        containerBounds,
        { x: event.clientX, y: event.clientY },
        screenEdge
      );
    }

    if (screenEdge !== this.currentEdge) {
      this.currentEdge = screenEdge;
      if (screenEdge) {
        this.storedDistanceFromEdge = distanceFromEdge;
        this.startEdgePanning(event.clientX, event.clientY);
      } else {
        this.storedDistanceFromEdge = undefined;
        this.stopEdgePanning();
      }
    }

    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'pointerMoveSelection',
      phase: 'continue',
      target: this.targetData(),
      targetType: 'node',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
      currentDiagramEdge: screenEdge,
      distanceFromEdge,
    });
  };

  private shouldHandle(event: PointerInputEvent): boolean {
    if (shouldDiscardEvent(event, 'drag')) {
      return false;
    }

    return !(event.zoomingHandled || event.linkingHandled || event.rotateHandled);
  }

  private getDiagramEdge(x: number, y: number): ContainerEdge {
    const threshold = this.flowCoreProvider.provide().config.selectionMoving.pointerEdgePanningThreshold;
    const bbox = this.diagramComponent.getBoundingClientRect();
    const edge = NgDiagramMath.detectContainerEdge(bbox, { x, y }, threshold);
    return edge;
  }

  private startEdgePanning(x: number, y: number): void {
    this.stopEdgePanning();

    this.edgePanningInterval = window.setInterval(() => {
      const baseEvent = this.inputEventsRouter.getBaseEvent({} as PointerEvent);

      this.inputEventsRouter.emit({
        ...baseEvent,
        name: 'pointerMoveSelection',
        phase: 'continue',
        target: this.targetData(),
        targetType: 'node',
        lastInputPoint: { x, y },
        currentDiagramEdge: this.currentEdge,
        distanceFromEdge: this.storedDistanceFromEdge,
      });
    }, FPS_60);
  }

  private stopEdgePanning(): void {
    if (this.edgePanningInterval != null) {
      window.clearInterval(this.edgePanningInterval);
      this.edgePanningInterval = null;
    }
    this.storedDistanceFromEdge = undefined;
  }
}
