import { Injectable, signal, WritableSignal } from '@angular/core';
import { DiagramEventName } from '../../types';

@Injectable({
  providedIn: 'root',
})
export class TouchEventsStateService {
  currentEvent: WritableSignal<DiagramEventName | null> = signal(null);

  clearCurrentEvent() {
    this.currentEvent.set(null);
  }

  rotateHandled(): boolean {
    return this.currentEvent() === DiagramEventName.Rotate;
  }

  resizeHandled(): boolean {
    return this.currentEvent() === DiagramEventName.Resize;
  }

  moveHandled(): boolean {
    return this.currentEvent() === DiagramEventName.Move;
  }

  boxSelectionHandled(): boolean {
    return this.currentEvent() === DiagramEventName.BoxSelection;
  }

  linkingHandled(): boolean {
    return this.currentEvent() === DiagramEventName.Linking;
  }

  panningHandled(): boolean {
    return this.currentEvent() === DiagramEventName.Panning;
  }

  zoomingHandled(): boolean {
    return this.currentEvent() === DiagramEventName.Zooming;
  }
}
