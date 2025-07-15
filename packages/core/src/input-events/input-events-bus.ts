import { __OLD__InputEvent } from '../types/__old__event/event.interface';
import { __OLD__EventListener } from '../types/event-mapper.interface';

export abstract class _NEW_InputEventsBus {
  private readonly listeners: __OLD__EventListener[] = [];
  // TODO: This class should allow registering and emitting input events

  register(eventListener: __OLD__EventListener) {
    this.listeners.push(eventListener);
  }

  emit(event: __OLD__InputEvent) {
    this.listeners.forEach((listener) => listener(event));
  }
}
