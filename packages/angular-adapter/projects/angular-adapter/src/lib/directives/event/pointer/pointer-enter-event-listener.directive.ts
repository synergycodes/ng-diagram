import { Directive } from '@angular/core';

/**
 * @deprecated
 */
@Directive({
  selector: '[angularAdapterPointerEnterEventListener]',
  host: { '(pointerenter)': 'onPointerEnter($event)' },
})
export class PointerEnterEventListenerDirective {
  // private readonly eventMapperService = inject(EventMapperService);

  // eventTarget = input<EventTarget>({ type: 'diagram' });
  // eventName = input<EventType>('unknown');

  onPointerEnter(event: PointerEvent) {
    throw new Error('Directive deprecated');
    // event.stopPropagation();
    // this.eventMapperService.emit(event, {
    //   name: this.eventName(),
    //   target: this.eventTarget(),
    // });
  }
}
