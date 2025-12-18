import { Point } from '../../../types';
import { EventHandler } from '../event-handler';
import { PanningEvent } from './panning.event';

/**
 * Standard panning handler - emits viewport movement on every pointer move.
 * Used when virtualization is disabled.
 */
export class PanningEventHandler extends EventHandler<PanningEvent> {
  private lastPoint: Point | undefined;

  handle(event: PanningEvent): void {
    switch (event.phase) {
      case 'start': {
        this.lastPoint = event.lastInputPoint;
        this.flow.actionStateManager.panning = { active: true };
        break;
      }
      case 'continue': {
        if (!this.flow.actionStateManager.isPanning() || !this.lastPoint) {
          break;
        }

        const x = event.lastInputPoint.x - this.lastPoint.x;
        const y = event.lastInputPoint.y - this.lastPoint.y;

        this.flow.commandHandler.emit('moveViewportBy', { x, y });
        this.lastPoint = event.lastInputPoint;
        break;
      }
      case 'end': {
        this.lastPoint = undefined;
        this.flow.actionStateManager.clearPanning();
        break;
      }
    }
  }
}
