import { Injectable, inject } from '@angular/core';
import { Event, EventListener, EventMapper } from '@angularflow/core';
import { CursorPositionTrackerService } from '../cursor-position-tracker/cursor-position-tracker.service';

@Injectable({ providedIn: 'root' })
export class EventMapperService implements EventMapper {
  private readonly listeners: EventListener[] = [];
  private readonly cursorTracker = inject(CursorPositionTrackerService);

  register(eventListener: EventListener): void {
    this.listeners.push(eventListener);
  }

  emit(event: Event): void {
    // Add cursor position to all events if not already present
    if (!event.cursorPosition && this.cursorTracker.hasRecentPosition()) {
      event.cursorPosition = this.cursorTracker.getLastPosition();
    }

    this.listeners.forEach((listener) => listener(event));
  }
}
