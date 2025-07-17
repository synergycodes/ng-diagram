import { Point } from '../../../types';
import { __NEW__EventHandler } from '../event-hander';
import { __NEW__PanningEvent } from './panning.event';

export class __NEW__PanningHandler extends __NEW__EventHandler<__NEW__PanningEvent> {
  private lastPoint: Point | undefined;
  private isPanning = false;

  handle(event: __NEW__PanningEvent): void {
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
