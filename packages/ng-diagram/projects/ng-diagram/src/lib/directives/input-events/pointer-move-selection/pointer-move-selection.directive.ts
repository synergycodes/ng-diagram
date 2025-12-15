import { Directive, inject, input, type OnDestroy } from '@angular/core';
import { FPS_60, NgDiagramMath, type Node, Point } from '../../../../core/src';
import { NgDiagramComponent } from '../../../components/diagram/ng-diagram.component';
import { FlowCoreProviderService } from '../../../services';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { TouchEventsStateService } from '../../../services/touch-events-state-service/touch-events-state-service.service';
import { DiagramEventName, type PointerInputEvent } from '../../../types/event';
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
  private readonly touchEventsStateService = inject(TouchEventsStateService);

  targetData = input<Node>();

  private edgePanningInterval: number | null = null;

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

    this.touchEventsStateService.currentEvent.set(DiagramEventName.Move);
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

    this.finishDragging(event);
  };

  private onPointerMove = (event: PointerInputEvent) => {
    if (
      event.zoomingHandled ||
      this.touchEventsStateService.boxSelectionHandled() ||
      this.touchEventsStateService.panningHandled() ||
      this.touchEventsStateService.zoomingHandled()
    ) {
      this.finishDragging(event);
      return;
    }

    const targetData = this.targetData();
    if (!targetData) {
      return;
    }

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    const {
      selectionMoving: { edgePanningThreshold, edgePanningEnabled, edgePanningForce },
      viewportPanningEnabled,
    } = this.flowCoreProvider.provide().config;

    let panningForce: Point | null = null;
    if (viewportPanningEnabled && edgePanningEnabled) {
      panningForce = NgDiagramMath.calculateEdgePanningForce(
        this.diagramComponent.getBoundingClientRect(),
        { x: event.clientX, y: event.clientY },
        edgePanningThreshold,
        edgePanningForce
      );

      if (panningForce) {
        this.startEdgePanning(event.clientX, event.clientY, panningForce);
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
      panningForce,
    });
  };

  private finishDragging(event: PointerInputEvent): void {
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

    this.touchEventsStateService.clearCurrentEvent();
  }

  private shouldHandle(event: PointerInputEvent): boolean {
    if (shouldDiscardEvent(event, 'drag')) {
      return false;
    }

    return !(
      event.zoomingHandled ||
      event.linkingHandled ||
      event.rotateHandled ||
      event.boxSelectionHandled ||
      this.touchEventsStateService.panningHandled() ||
      this.touchEventsStateService.zoomingHandled()
    );
  }

  private startEdgePanning(x: number, y: number, panningForce: Point | null): void {
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
        panningForce,
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
