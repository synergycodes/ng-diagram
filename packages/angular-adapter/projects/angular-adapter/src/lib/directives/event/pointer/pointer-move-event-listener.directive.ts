import { Directive } from '@angular/core';

// import { EventType } from '@angularflow/core';

/**
 * @deprecated
 */
@Directive({
  selector: '[angularAdapterPointerMoveEventListener]',
  host: { '(pointermove)': 'onPointerMove($event)' },
})
export class PointerMoveEventListenerDirective {
  // private readonly eventMapperService = inject(EventMapperService);
  // eventName = input<EventType>('unknown');

  onPointerMove(event: PointerEvent) {
    throw new Error('Directive deprecated');
    // this.eventMapperService.emit(event, {
    //   name: this.eventName(),
    //   target: { type: 'diagram' },
    // });
  }
}
