import { Directive, inject } from '@angular/core';
import { FlowCoreProviderService } from '../../../services/flow-core-provider/flow-core-provider.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { WheelInputEvent } from '../../../types';

const PINCH_DELTA_THRESHOLD = 50;
const PINCH_ZOOM_SENSITIVITY = 0.01;

@Directive({
  selector: '[ngDiagramZoomingWheel]',
  standalone: true,
  host: {
    '(wheel)': 'onWheel($event)',
  },
})
export class ZoomingWheelDirective {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly inputEventsRouterService = inject(InputEventsRouterService);

  onWheel(event: WheelInputEvent) {
    if (!this.shouldHandle(event)) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    event.zoomingHandled = true;

    const flow = this.flowCoreProvider.provide();
    const zoomFactor = this.getZoomFactor(event, flow.config.zoom.step);

    const baseEvent = this.inputEventsRouterService.getBaseEvent(event);
    this.inputEventsRouterService.emit({
      ...baseEvent,
      name: 'zoom',
      centerPoint: {
        x: event.clientX,
        y: event.clientY,
      },
      zoomFactor,
    });
  }

  private shouldHandle(event: WheelInputEvent): boolean {
    if (event.zoomingHandled) {
      return false;
    }

    if (this.isPinchGesture(event)) {
      return true;
    }

    const flowCore = this.flowCoreProvider.provide();
    const modifiers = this.inputEventsRouterService.getBaseEvent(event).modifiers;
    return flowCore.shortcutManager.matchesAction('zoom', { modifiers });
  }

  private isPinchGesture(event: WheelInputEvent): boolean {
    return event.ctrlKey && Math.abs(event.deltaY) < PINCH_DELTA_THRESHOLD;
  }

  private getZoomFactor(event: WheelInputEvent, step: number): number {
    if (this.isPinchGesture(event)) {
      return Math.exp(-event.deltaY * PINCH_ZOOM_SENSITIVITY);
    }
    return event.deltaY > 0 ? 1 - step : 1 + step;
  }
}
