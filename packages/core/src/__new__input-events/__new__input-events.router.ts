import { FlowCore } from '../flow-core';
import { __NEW__InputEventName, __NEW__NEW__BaseInputEvent } from './__new__input-events.interface';
import { __NEW__EventHandler } from './handlers/event-hander';
import { __NEW__PanningHandler } from './handlers/panning/panning.handler';
import { __NEW__PointerMoveSelectionHandler } from './handlers/pointer-move-selection/pointer-move-selection.handler';
import { __NEW__SelectHandler } from './handlers/select/select.handler';

export abstract class __NEW__InputEventsRouter {
  private handlers: Partial<Record<__NEW__InputEventName, __NEW__EventHandler<__NEW__NEW__BaseInputEvent>>> = {};

  emit<TEvent extends __NEW__NEW__BaseInputEvent>(event: TEvent) {
    const handler = this.handlers[event.name];
    if (!handler) {
      console.warn(`No handler registered for event: ${event.name}`);
      return;
    }

    return handler.handle(event as __NEW__NEW__BaseInputEvent);
  }

  register<K extends __NEW__InputEventName>(eventName: K, handler: __NEW__EventHandler<__NEW__NEW__BaseInputEvent>) {
    this.handlers[eventName] = handler;
  }

  registerDefaultCallbacks(flow: FlowCore) {
    this.register('select', new __NEW__SelectHandler(flow));
    this.register('panning', new __NEW__PanningHandler(flow));
    this.register('pointer-move-selection', new __NEW__PointerMoveSelectionHandler(flow));
    // TODO: Call register for each default event handler
  }
}
