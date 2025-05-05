import { Injectable } from '@angular/core';
import { Event, EventListener, EventMapper } from '@angularflow/core';

@Injectable({ providedIn: 'root' })
export class EventMapperService implements EventMapper {
  private readonly listeners: EventListener[] = [];

  register(eventListener: EventListener): void {
    this.listeners.push(eventListener);
  }

  emit(event: Event): void {
    this.listeners.forEach((listener) => listener(event));
  }
}
