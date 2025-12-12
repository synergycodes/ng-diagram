import { Point } from '../../../types';
import { EventHandler } from '../event-handler';
import { PanningEvent } from './panning.event';

/**
 * Handles panning events with RAF-based throttling to reduce middleware executions.
 * Accumulates viewport deltas and emits them once per animation frame instead of
 * on every pointer move event.
 */
export class PanningEventHandler extends EventHandler<PanningEvent> {
  private lastPoint: Point | undefined;
  private isPanning = false;

  /** Accumulated delta since last RAF flush */
  private accumulatedDelta: Point = { x: 0, y: 0 };

  /** Whether a RAF callback is scheduled */
  private rafScheduled = false;

  /** Count of accumulated events since last flush */
  private accumulatedEventCount = 0;

  handle(event: PanningEvent): void {
    switch (event.phase) {
      case 'start': {
        this.lastPoint = event.lastInputPoint;
        this.isPanning = true;
        this.accumulatedDelta = { x: 0, y: 0 };
        this.accumulatedEventCount = 0;
        this.flow.eventManager.emit('panStarted', {});
        break;
      }
      case 'continue': {
        if (!this.isPanning || !this.lastPoint) {
          break;
        }

        // Accumulate delta instead of emitting immediately
        const x = event.lastInputPoint.x - this.lastPoint.x;
        const y = event.lastInputPoint.y - this.lastPoint.y;

        this.accumulatedDelta.x += x;
        this.accumulatedDelta.y += y;
        this.lastPoint = event.lastInputPoint;
        this.accumulatedEventCount++;

        // Schedule RAF if not already scheduled
        this.scheduleFlush();
        break;
      }
      case 'end':
        // Flush any remaining delta immediately on end
        this.flushDelta();
        this.lastPoint = undefined;
        this.isPanning = false;
        this.rafScheduled = false;
        this.flow.eventManager.emit('panEnded', {});
        break;
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
      this.accumulatedEventCount = 0;
    }
  }
}
