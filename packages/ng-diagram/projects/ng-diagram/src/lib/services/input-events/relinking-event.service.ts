import { inject, Injectable } from '@angular/core';
import { Edge, EdgeEnd, Point } from '../../../core/src';
import { PointerInputEvent } from '../../types';
import { InputEventsRouterService } from './input-events-router.service';

@Injectable()
export class RelinkingEventService {
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  emitStart(event: PointerInputEvent, target: Edge | undefined, end: EdgeEnd) {
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'relinking',
      phase: 'start',
      target,
      targetType: 'edge',
      end,
      lastInputPoint: { x: event.clientX, y: event.clientY },
      panningForce: null,
    });
  }

  emitContinue(event: PointerInputEvent, target: Edge | undefined, end: EdgeEnd, panningForce: Point | null = null) {
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'relinking',
      phase: 'continue',
      target,
      targetType: 'edge',
      end,
      lastInputPoint: { x: event.clientX, y: event.clientY },
      panningForce,
    });
  }

  emitEnd(event: PointerInputEvent, target: Edge | undefined, end: EdgeEnd, takenOver = false) {
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'relinking',
      phase: 'end',
      target,
      targetType: 'edge',
      end,
      lastInputPoint: { x: event.clientX, y: event.clientY },
      panningForce: null,
      takenOver,
    });
  }
}
