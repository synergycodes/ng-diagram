import { Directive, inject, type OnDestroy } from '@angular/core';
import { FlowCoreProviderService } from '../../../services';
import { BoxSelectionProviderService } from '../../../services/box-selection-provider/box-selection-provider.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import type { PointerInputEvent } from '../../../types/event';

@Directive({
  selector: '[ngDiagramBoxSelection]',
  standalone: true,
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class BoxSelectionDirective implements OnDestroy {
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly boxSelectionProvider = inject(BoxSelectionProviderService);
  private readonly flowCore = inject(FlowCoreProviderService);
  private startPoint: { x: number; y: number } | null = null;
  static isBoxSelectionActive = false;

  ngOnDestroy(): void {
    document.removeEventListener('pointermove', this.onMouseMove);
    document.removeEventListener('pointerup', this.onPointerUp);
  }

  onPointerDown(event: PointerInputEvent): void {
    if (!this.inputEventsRouter.eventGuards.withPrimaryButton(event) || !this.shouldHandle(event)) {
      return;
    }

    BoxSelectionDirective.isBoxSelectionActive = true;
    event.preventDefault();
    event.stopPropagation();

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'boxSelection',
      phase: 'start',
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });

    this.startPoint = { x: event.clientX, y: event.clientY };

    document.addEventListener('pointermove', this.onMouseMove);
    document.addEventListener('pointerup', this.onPointerUp);
  }

  onPointerUp = (event: PointerEvent): void => {
    BoxSelectionDirective.isBoxSelectionActive = false;
    if (!this.inputEventsRouter.eventGuards.withPrimaryButton(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    document.removeEventListener('pointermove', this.onMouseMove);
    document.removeEventListener('pointerup', this.onPointerUp);

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'boxSelection',
      phase: 'end',
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });

    this.startPoint = null;
    this.boxSelectionProvider.boundingBox.set(null);
  };

  private onMouseMove = (event: PointerInputEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'boxSelection',
      phase: 'continue',
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });

    if (this.startPoint) {
      const flowCore = this.flowCore.provide();
      const { x: startX, y: startY } = flowCore.clientToFlowViewportPosition(this.startPoint);
      const { x: endX, y: endY } = flowCore.clientToFlowViewportPosition({ x: event.clientX, y: event.clientY });

      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);
      this.boxSelectionProvider.boundingBox.set({
        x,
        y,
        width,
        height,
      });
    }
  };

  private shouldHandle(event: PointerInputEvent): boolean {
    return event.shiftKey;
  }
}
