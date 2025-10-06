import { Point } from '../../../types';
import { EventHandler } from '../event-handler';
import { PanningEvent } from './panning.event';

export class PanningEventHandler extends EventHandler<PanningEvent> {
  private lastPoint: Point | undefined;
  private isPanning = false;

  handle(event: PanningEvent): void {
    switch (event.phase) {
      case 'start': {
        this.lastPoint = event.lastInputPoint;
        this.isPanning = true;
        break;
      }
      case 'continue': {
        if (!this.isPanning || !this.lastPoint) {
          break;
        }

        const x = event.lastInputPoint.x - this.lastPoint.x;
        const y = event.lastInputPoint.y - this.lastPoint.y;

        this.flow.commandHandler.emit('moveViewportBy', { x, y });
        this.lastPoint = event.lastInputPoint;
        break;
      }
      case 'end':
        this.lastPoint = undefined;
        this.isPanning = false;
        break;
    }
  }
}
