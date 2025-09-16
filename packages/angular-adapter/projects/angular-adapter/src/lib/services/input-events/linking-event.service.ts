import { inject, Injectable } from '@angular/core';
import { Node } from '@angularflow/core';
import { PointerInputEvent } from '../../types';
import { InputEventsRouterService } from './input-events-router.service';

@Injectable()
export class LinkingEventService {
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  emitStart(event: PointerInputEvent, target?: Node, portId?: string) {
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'linking',
      phase: 'start',
      target: target,
      targetType: 'node',
      portId: portId,
      lastInputPoint: { x: event.clientX, y: event.clientY },
    });
  }

  emitContinue(event: PointerInputEvent, target?: Node, portId?: string) {
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'linking',
      phase: 'continue',
      target: target,
      targetType: 'node',
      portId: portId,
      lastInputPoint: { x: event.clientX, y: event.clientY },
    });
  }

  emitEnd(event: PointerInputEvent, target?: Node, portId?: string) {
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'linking',
      phase: 'end',
      target: target,
      targetType: 'node',
      portId: portId,
      lastInputPoint: { x: event.clientX, y: event.clientY },
    });
  }
}
