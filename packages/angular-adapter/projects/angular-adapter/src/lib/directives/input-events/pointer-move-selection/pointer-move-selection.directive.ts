import { Directive, inject, input, OnDestroy } from '@angular/core';
import { Node, ScreenEdge } from '@angularflow/core';
import { NgDiagramComponent } from '../../../../public-api';
import { BrowserInputsHelpers } from '../../../services/input-events/browser-inputs-helpers';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PointerInputEvent } from '../../../types/event';
import { shouldDiscardEvent } from '../utils/should-discard-event';

const EDGE_PANNING_THRESHOLD = 10;

@Directive({
  selector: '[ngDiagramPointerMoveSelection]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class PointerMoveSelectionDirective implements OnDestroy {
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly diagramComponent = inject(NgDiagramComponent);

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
      currentScreenEdge: null,
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
      currentScreenEdge: null,
    });
  };

  private onPointerMove = (event: PointerInputEvent) => {
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    const screenEdge = this.isScreenEdge(event.clientX, event.clientY);
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
      currentScreenEdge: screenEdge,
    });
  };

  private shouldHandle(event: PointerInputEvent): boolean {
    if (shouldDiscardEvent(event, 'drag')) {
      return false;
    }

    return !(event.zoomingHandled || event.linkingHandled || event.rotateHandled);
  }

  private isScreenEdge(x: number, y: number): ScreenEdge {
    const bbox = this.diagramComponent.getBoundingClientRect();
    const localX = x - bbox.left;
    const localY = y - bbox.top;
    const innerWidth = bbox.width;
    const innerHeight = bbox.height;

    if (localX < EDGE_PANNING_THRESHOLD && localY < EDGE_PANNING_THRESHOLD) return 'topleft';
    if (localX < EDGE_PANNING_THRESHOLD && localY > innerHeight - EDGE_PANNING_THRESHOLD) return 'bottomleft';
    if (localX < EDGE_PANNING_THRESHOLD) return 'left';
    if (localX > innerWidth - EDGE_PANNING_THRESHOLD && localY < EDGE_PANNING_THRESHOLD) return 'topright';
    if (localX > innerWidth - EDGE_PANNING_THRESHOLD && localY > innerHeight - EDGE_PANNING_THRESHOLD)
      return 'bottomright';
    if (localX > innerWidth - EDGE_PANNING_THRESHOLD) return 'right';
    if (localY < EDGE_PANNING_THRESHOLD) return 'top';
    if (localY > innerHeight - EDGE_PANNING_THRESHOLD) return 'bottom';

    return null;
  }
}
