import { Directive } from '@angular/core';

/**
 * @deprecated
 */
@Directive({
  selector: '[angularAdapterPointerDownEventListener]',
  host: { '(pointerdown)': 'onPointerDown($event)' },
})
export class PointerDownEventListenerDirective {
  // private readonly eventMapperService = inject(EventMapperService);
  // eventTarget = input<EventTarget>({ type: 'diagram' });
  // eventName = input<EventType>('unknown');
  onPointerDown(event: PointerEvent) {
    throw new Error('Directive deprecated');
    // console.log('lalalalala');
    // event.stopPropagation();
    // const currentTarget = event.currentTarget as HTMLElement;
    // currentTarget.setPointerCapture(event.pointerId);
    // this.eventMapperService.emit(event, {
    //   name: this.eventName(),
    //   target: this.eventTarget(),
    // });
  }
}
