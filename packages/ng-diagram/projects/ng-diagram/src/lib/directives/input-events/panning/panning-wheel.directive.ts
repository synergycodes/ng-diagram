import { Directive, inject } from '@angular/core';
import { NgDiagramService } from '../../../public-services/ng-diagram.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { shouldDiscardEvent } from '../utils/should-discard-event';

@Directive({
  selector: '[ngDiagramPanningWheel]',
  standalone: true,
  host: {
    '(wheel)': 'onWheel($event)',
  },
})
export class PanningWheelDirective {
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly diagramService = inject(NgDiagramService);

  onWheel(event: WheelEvent): void {
    if (!this.shouldHandle(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // Calculate deltas for panning direction
    const deltaX = event.shiftKey ? event.deltaY : event.deltaX;
    const deltaY = event.shiftKey ? 0 : event.deltaY;

    const direction =
      Math.abs(deltaX) > Math.abs(deltaY) ? (deltaX > 0 ? 'left' : 'right') : deltaY > 0 ? 'top' : 'bottom';

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'keyboardPanning',
      direction,
    });
  }

  private shouldHandle(event: WheelEvent): boolean {
    const { viewportPanningEnabled } = this.diagramService.config();
    if (
      !viewportPanningEnabled ||
      shouldDiscardEvent(event, 'pan') ||
      this.inputEventsRouter.eventGuards.withPrimaryModifier(event)
    ) {
      return false;
    }

    return true;
  }
}
