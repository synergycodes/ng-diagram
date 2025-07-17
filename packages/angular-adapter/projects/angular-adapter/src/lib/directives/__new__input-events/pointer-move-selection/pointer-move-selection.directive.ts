import { Directive, ElementRef, inject } from '@angular/core';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PointerDragEvent } from '../../../types/event';

@Directive({
  selector: '[angularAdapterPointerMoveSelection]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
    // '(pointermove)': 'onPointerMove($event)',
  },
})
export class PointerMoveSelectionDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  onPointerDown(event: PointerDragEvent): void {
    event.moveSelectionHandled = true;

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'pointer-move-selection',
      phase: 'start',
      // TODO: Add data
      target: undefined,
      targetType: 'node',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });

    this.elementRef.nativeElement.addEventListener('pointermove', this.onPointerMove);
  }

  onPointerUp(event: PointerEvent): void {
    this.elementRef.nativeElement.removeEventListener('pointermove', this.onPointerMove);

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'pointer-move-selection',
      phase: 'end',
      // TODO: Add data
      target: undefined,
      targetType: 'node',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  }

  private onPointerMove = (event: PointerEvent) => {
    // console.log('Pointer move selection event:', event);
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'pointer-move-selection',
      phase: 'continue',
      // TODO: Add data
      target: undefined,
      targetType: 'node',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  };
}
