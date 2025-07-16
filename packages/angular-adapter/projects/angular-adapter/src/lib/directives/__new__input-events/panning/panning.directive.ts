import { Directive, ElementRef, inject } from '@angular/core';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';

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

  onPointerDown(event: PointerEvent): void {
    // TODO: Handle dragging and resizing events

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

    this.elementRef.nativeElement.addEventListener('mousemove', this.onMouseMove);
  }

  onPointerUp(event: PointerEvent): void {
    this.elementRef.nativeElement.removeEventListener('mousemove', this.onMouseMove);

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

  private onMouseMove = (event: PointerEvent) => {
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
}
