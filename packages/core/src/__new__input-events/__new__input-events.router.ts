import { FlowCore } from '../flow-core';
import { __NEW__InputEventName, __NEW__NEW__BaseInputEvent } from './__new__input-events.interface';
import { __NEW__EventHandler } from './handlers/event-hander';
import { NodeSelectHandler } from './handlers/node-select/node-select.handler';

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
    this.register('node-select', new NodeSelectHandler(flow));
    // TODO: Call register for each default event handler
  }
  // registerHandler(event)
  // This class is intended to be extended by other classes that will implement
  // specific input event handling logic.

  // Define abstract methods or properties here if needed.

  // Example:
  // abstract handleEvent(event: InputEvent): void;
}
