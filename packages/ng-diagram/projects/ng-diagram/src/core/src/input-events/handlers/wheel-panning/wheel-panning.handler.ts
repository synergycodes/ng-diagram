import { EventHandler } from '../event-handler';
import { WheelPanningEvent } from './wheel-panning.event';

const WHEEL_IDLE_TIMEOUT_MS = 100;

export class WheelPanningEventHandler extends EventHandler<WheelPanningEvent> {
  private idleTimeout: ReturnType<typeof setTimeout> | undefined;

  handle(event: WheelPanningEvent): void {
    const { deltaX, deltaY } = event;

    if (deltaX === 0 && deltaY === 0) {
      return;
    }

    this.activatePanning();
    this.flow.commandHandler.emit('moveViewportBy', { x: -deltaX || 0, y: -deltaY || 0 });
  }

  private activatePanning(): void {
    this.flow.actionStateManager.panning = { active: true };

    if (this.idleTimeout !== undefined) {
      clearTimeout(this.idleTimeout);
    }

    this.idleTimeout = setTimeout(() => {
      this.flow.actionStateManager.clearPanning();
      this.idleTimeout = undefined;
    }, WHEEL_IDLE_TIMEOUT_MS);
  }
}
