import { __NEW__EventHandler } from '../event-hander';
import { __NEW__ZoomingEvent } from './zooming.event';

export const SCALE = {
  MIN: 0.1,
  MAX: 10,
  STEP: 0.05,
} as const;

export class ZoomingEventHandler extends __NEW__EventHandler<__NEW__ZoomingEvent> {
  handle(event: __NEW__ZoomingEvent): void {
    // Handle zooming logic here
    console.log(`Zooming at point: ${event.lastInputPoint.x}, ${event.lastInputPoint.y} with deltaY: ${event.deltaY}`);
  }
}
