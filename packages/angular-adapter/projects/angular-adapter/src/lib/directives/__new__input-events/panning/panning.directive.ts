import { Directive, ElementRef, inject } from '@angular/core';
import { BrowserInputsHelpers } from '../../../services/input-events/browser-inputs-helpers';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PointerInputEvent } from '../../../types/event';

@Directive({
  selector: '[angularAdapterPanning]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
  },
})
export class __NEW__PanningDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  onPointerDown(event: PointerInputEvent): void {
    if (!BrowserInputsHelpers.withPrimaryButton(event) || this.isHandled(event)) {
      return;
    }

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'panning',
      phase: 'start',
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });

    this.elementRef.nativeElement.addEventListener('pointermove', this.onMouseMove);
  }

  onPointerUp(event: PointerEvent): void {
    if (!BrowserInputsHelpers.withPrimaryButton(event)) {
      return;
    }

    this.elementRef.nativeElement.removeEventListener('pointermove', this.onMouseMove);

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'panning',
      phase: 'end',
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  }

  private onMouseMove = (event: PointerInputEvent) => {
    if (this.isHandled(event)) {
      return;
    }

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'panning',
      phase: 'continue',
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  };

  private isHandled(event: PointerInputEvent): boolean {
    return !!(event.moveSelectionHandled || event.zoomingHandled || event.linkingHandled || event.rotateHandled);
  }
}
