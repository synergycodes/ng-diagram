import { Directive, inject, input, type OnDestroy } from '@angular/core';
import { type ContainerEdge, FPS_60, NgDiagramMath, type Node } from '../../../../core/src';
import { NgDiagramComponent } from '../../../components/diagram/ng-diagram.component';
import { FlowCoreProviderService } from '../../../services';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import type { PointerInputEvent } from '../../../types/event';
import { shouldDiscardEvent } from '../utils/should-discard-event';

@Directive({
  selector: '[ngDiagramPointerMoveSelection]',
  standalone: true,
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class PointerMoveSelectionDirective implements OnDestroy {
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly diagramComponent = inject(NgDiagramComponent);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  targetData = input<Node>();

  private edgePanningInterval: number | null = null;
  private currentEdge: ContainerEdge = null;

  ngOnDestroy() {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    this.stopEdgePanning();
  }

  onPointerDown(event: PointerInputEvent): void {
    if (!this.shouldHandle(event)) {
      return;
    }

    if (!this.inputEventsRouter.eventGuards.withPrimaryButton(event)) {
      return;
    }

    const targetData = this.targetData();
    if (!targetData) {
      return;
    }

    event.moveSelectionHandled = true;

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'pointerMoveSelection',
      phase: 'start',
      target: targetData,
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
    if (!this.inputEventsRouter.eventGuards.withPrimaryButton(event)) {
      return;
    }

    const targetData = this.targetData();
    if (!targetData) {
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
      target: targetData,
      targetType: 'node',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
      currentDiagramEdge: null,
    });
  };

  private onPointerMove = (event: PointerInputEvent) => {
    const targetData = this.targetData();
    if (!targetData) {
      return;
    }

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    const screenEdge = this.getDiagramEdge(event.clientX, event.clientY);

    if (screenEdge !== this.currentEdge) {
      this.currentEdge = screenEdge;
      if (screenEdge) {
        this.startEdgePanning(event.clientX, event.clientY);
      } else {
        this.stopEdgePanning();
      }
    }

    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'pointerMoveSelection',
      phase: 'continue',
      target: targetData,
      targetType: 'node',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
      currentDiagramEdge: screenEdge,
    });
  };

  private shouldHandle(event: PointerInputEvent): boolean {
    if (shouldDiscardEvent(event, 'drag')) {
      return false;
    }

    if (event.boxSelectionHandled) {
      return false;
    }

    return !(event.zoomingHandled || event.linkingHandled || event.rotateHandled);
  }

  private getDiagramEdge(x: number, y: number): ContainerEdge {
    const threshold = this.flowCoreProvider.provide().config.selectionMoving.edgePanningThreshold;
    const bbox = this.diagramComponent.getBoundingClientRect();
    const edge = NgDiagramMath.detectContainerEdge(bbox, { x, y }, threshold);
    return edge;
  }

  private startEdgePanning(x: number, y: number): void {
    this.stopEdgePanning();

    this.edgePanningInterval = window.setInterval(() => {
      const targetData = this.targetData();
      if (!targetData) {
        return;
      }

      const baseEvent = this.inputEventsRouter.getBaseEvent({} as PointerEvent);

      this.inputEventsRouter.emit({
        ...baseEvent,
        name: 'pointerMoveSelection',
        phase: 'continue',
        target: targetData,
        targetType: 'node',
        lastInputPoint: { x, y },
        currentDiagramEdge: this.currentEdge,
      });
    }, FPS_60);
  }

  private stopEdgePanning(): void {
    if (this.edgePanningInterval != null) {
      window.clearInterval(this.edgePanningInterval);
      this.edgePanningInterval = null;
    }
  }
}
