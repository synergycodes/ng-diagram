import { Point } from '../../../types';
import { EventHandler } from '../event-handler';
import { PanningEvent } from './panning.event';

/**
 * Virtualized panning handler with RAF-based throttling.
 * Accumulates viewport deltas and emits them once per animation frame
 * to reduce middleware executions and improve performance with large diagrams.
 *
 * Pan idle buffer fill is handled automatically by VirtualizedRenderStrategy
 * via actionStateChanged events.
 */
export class VirtualizedPanningEventHandler extends EventHandler<PanningEvent> {
  private lastPoint: Point | undefined;
  private accumulatedDelta: Point = { x: 0, y: 0 };
  private rafScheduled = false;

  handle(event: PanningEvent): void {
    switch (event.phase) {
      case 'start': {
        this.lastPoint = event.lastInputPoint;
        this.accumulatedDelta = { x: 0, y: 0 };
        this.flow.actionStateManager.panning = { active: true };
        break;
      }
      case 'continue': {
        if (!this.flow.actionStateManager.isPanning() || !this.lastPoint) {
          break;
        }

        const x = event.lastInputPoint.x - this.lastPoint.x;
        const y = event.lastInputPoint.y - this.lastPoint.y;

        this.accumulatedDelta.x += x;
        this.accumulatedDelta.y += y;
        this.lastPoint = event.lastInputPoint;

        this.scheduleFlush();
        break;
      }
      case 'end': {
        this.flushDelta();
        this.lastPoint = undefined;
        this.rafScheduled = false;
        this.flow.actionStateManager.clearPanning();
        break;
      }
    }
  }

  /**
   * Schedules a RAF callback to flush accumulated delta.
   * Only one callback is scheduled at a time.
   */
  private scheduleFlush(): void {
    if (this.rafScheduled) {
      return;
    }

    this.rafScheduled = true;
    requestAnimationFrame(() => {
      this.flushDelta();
      this.rafScheduled = false;
    });
  }

  /**
   * Emits the accumulated viewport delta if non-zero, then resets it.
   */
  private flushDelta(): void {
    const { x, y } = this.accumulatedDelta;

    if (x !== 0 || y !== 0) {
      this.flow.commandHandler.emit('moveViewportBy', { x, y });
      this.accumulatedDelta = { x: 0, y: 0 };
    }
  }
}
