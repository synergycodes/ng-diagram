import { Injectable } from '@angular/core';

import { Event } from '../types';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  handle(event: Event) {
    switch (event.type) {
      case 'pointerdown':
      case 'pointerup':
      case 'pointermove':
      case 'pointerenter':
      case 'pointerleave':
        console.log(event.type, event);
        break;
      default:
        throw new Error(`Unknown event passed.`);
    }
  }
}
