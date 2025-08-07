import { Directive, inject, input, OnDestroy } from '@angular/core';
import { ContainerEdge, NgDiagramMath, Node } from '@angularflow/core';
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

  ngOnDestroy() {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
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
    });
  };

  private shouldHandle(event: PointerInputEvent): boolean {
    if (shouldDiscardEvent(event, 'drag')) {
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
}
