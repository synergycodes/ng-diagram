import { Directive } from '@angular/core';

/**
 * @deprecated
 */
@Directive({
  selector: '[angularAdapterPointerUpEventListener]',
  host: { '(pointerup)': 'onPointerUp($event)' },
})
export class PointerUpEventListenerDirective {
  // eventTarget: InputSignal<EventTarget>;
  // eventTarget: InputSignal<EventTarget>;
  // private readonly eventMapperService = inject(EventMapperService);

  // eventTarget = input<EventTarget>({ type: 'diagram' });
  // eventName = input<EventType>('unknown');

  onPointerUp(event: PointerEvent) {
    throw new Error('Directive deprecated');
    // event.stopPropagation();
    // this.eventMapperService.emit(event, {
    //   name: this.eventName(),
    //   target: this.eventTarget(),
    // });
  }
}
