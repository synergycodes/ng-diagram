import { Injectable } from '@angular/core';
import {
  BaseInputEvent,
  BasePointerEvent,
  EventByName,
  EventListener,
  EventMapper,
  EventTarget,
  EventType,
  InputEvent,
  InputModifiers,
  InteractionPhase,
  KeyboardInputEvent,
  WheelInputEvent,
} from '@angularflow/core';
import { getOS } from '../flow-core-provider/detect-environment';

type DomEvent = KeyboardEvent | WheelEvent | PointerEvent;

type EventData = {
  target: EventTarget;
  name: string;
};
// Type guards
const isKeyboardEvent = (event: DomEvent): event is KeyboardEvent => event instanceof KeyboardEvent;

const isWheelEvent = (event: DomEvent): event is WheelEvent => event instanceof WheelEvent;

const isPointerEvent = (event: DomEvent): event is PointerEvent => event instanceof PointerEvent;

// Extract data type from EventByName, with default for events without data
type EventDataType<T extends EventType> = EventByName<T> extends { data: infer D } ? D : never;

// Type-safe event emission configuration
type EventEmitConfig<T extends EventType> =
  EventDataType<T> extends never
    ? { name: T; target: EventTarget; data?: never }
    : { name: T; target: EventTarget; data: EventDataType<T> };

@Injectable({ providedIn: 'root' })
export class EventMapperService implements EventMapper {
  private readonly listeners: EventListener[] = [];

  private readonly phaseMap: Record<string, InteractionPhase> = {
    // Keyboard
    keydown: 'start',
    keypress: 'continue',
    keyup: 'end',

    // Pointer / mouse / touch
    pointerdown: 'start',
    mousedown: 'start',
    touchstart: 'start',
    pointermove: 'continue',
    mousemove: 'continue',
    touchmove: 'continue',
    pointerup: 'end',
    mouseup: 'end',
    touchend: 'end',
    pointercancel: 'abort',

    // Wheel
    wheel: 'continue',
  };

  register(eventListener: EventListener): void {
    this.listeners.push(eventListener);
  }

  emit<T extends EventType>(event: DomEvent, config: EventEmitConfig<T>): void {
    const domainEvent = this.constructEvent(event, config);
    console.log('emit', domainEvent);

    this.listeners.forEach((listener) => listener(domainEvent));
  }

  private constructEvent<T extends EventType>(event: DomEvent, { name, target, data }: EventEmitConfig<T>): InputEvent {
    const inputEvent: Omit<BaseInputEvent, 'source'> = {
      id: this.generateEventId(),
      timestamp: performance.now(),
      modifiers: this.getModifiers(event),
      target,
      originalEvent: event.type,
      phase: this.getPhase(event),
      name,
      ...(data ? { data } : {}),
    };

    if (isKeyboardEvent(event)) {
      const keyboardEvent: KeyboardInputEvent = {
        ...inputEvent,
        key: event.key,
        code: event.code,
        source: 'keyboard',
        name: 'press',
      };

      return keyboardEvent;
    }

    if (isWheelEvent(event)) {
      const wheelEvent: WheelInputEvent = {
        ...inputEvent,
        position: { x: event.clientX, y: event.clientY },
        delta: { x: event.deltaX, y: event.deltaY },
        source: 'wheel',
        name: 'wheel',
      };

      return wheelEvent;
    }

    if (isPointerEvent(event)) {
      const pointerEvent: BasePointerEvent = {
        ...inputEvent,
        position: { x: event.clientX, y: event.clientY },
        pointerId: event.pointerId,
        pressure: event.pressure,
        pointerType: event.pointerType as 'mouse' | 'touch' | 'pen',
        source: 'pointer',
        button: event.button,
      };

      return pointerEvent;
    }

    throw new Error(`[ngDiagram]: Unknown event: ${event}`);
  }

  private getPhase(event: DomEvent): InteractionPhase {
    return this.phaseMap[event.type] || 'continue';
  }

  private generateEventId(): string {
    // NOTE: Works only in https
    return crypto.randomUUID();
  }

  private getModifiers(event: DomEvent): InputModifiers {
    const isMac = getOS() === 'MacOS';

    return {
      primary: isMac ? event.metaKey : event.ctrlKey,
      secondary: event.altKey,
      shift: event.shiftKey,
      meta: event.metaKey,
    };
  }
}
