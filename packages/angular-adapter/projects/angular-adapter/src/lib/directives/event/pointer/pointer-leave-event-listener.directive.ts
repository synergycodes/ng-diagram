import { Directive } from '@angular/core';

/**
 * @deprecated
 */
@Directive({
  selector: '[angularAdapterPointerLeaveEventListener]',
  host: { '(pointerleave)': 'onPointerLeave($event)' },
})
export class PointerLeaveEventListenerDirective {
  // eventTarget: InputSignal<EventTarget>;
  // private readonly eventMapperService = inject(EventMapperService);

  // eventTarget = input<EventTarget>({ type: 'diagram' });
  // eventName = input<EventType>('unknown');

  onPointerLeave(event: PointerEvent) {
    throw new Error('Directive deprecated');
    // event.stopPropagation();
    // this.eventMapperService.emit(event, {
    //   name: this.eventName(),
    //   target: this.eventTarget(),
    // });
  }
}
