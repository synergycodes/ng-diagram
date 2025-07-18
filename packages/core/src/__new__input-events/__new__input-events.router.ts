import { FlowCore } from '../flow-core';
import { BaseInputEvent, InputEventName } from './__new__input-events.interface';
import { CopyEventHandler } from './handlers/copy/copy.handler';
import { __NEW__DeleteSelectionEventHandler } from './handlers/delete-selection/delete-selection.handler';
import { __NEW__EventHandler } from './handlers/event-hander';
import { KeyboardMoveSelectionEventHandler } from './handlers/keyboard-move-selection/keyboard-move-selection.handler';
import { KeyboardPanningEventHandler } from './handlers/keyboard-panning/keyboard-panning.handler';
import { __NEW__PanningEventHandler } from './handlers/panning/panning.handler';
import { __NEW__PasteEventHandler } from './handlers/paste/paste.handler';
import { __NEW__PointerMoveSelectionEventHandler } from './handlers/pointer-move-selection/pointer-move-selection.handler';
import { __NEW__ResizeEventHandler } from './handlers/resize/resize.handler';
import { __NEW__SelectEventHandler } from './handlers/select/select.handler';

export abstract class __NEW__InputEventsRouter {
  private handlers: Partial<Record<InputEventName, __NEW__EventHandler<BaseInputEvent>>> = {};

  emit<TEvent extends BaseInputEvent>(event: TEvent) {
    const handler = this.handlers[event.name];
    if (!handler) {
      console.warn(`No handler registered for event: ${event.name}`);
      return;
    }

    return handler.handle(event as BaseInputEvent);
  }

  register<K extends InputEventName>(eventName: K, handler: __NEW__EventHandler<BaseInputEvent>) {
    this.handlers[eventName] = handler;
  }

  registerDefaultCallbacks(flow: FlowCore) {
    this.register('copy', new CopyEventHandler(flow));
    this.register('select', new __NEW__SelectEventHandler(flow));
    this.register('panning', new __NEW__PanningEventHandler(flow));
    this.register('keyboardPanning', new KeyboardPanningEventHandler(flow));
    this.register('pointerMoveSelection', new __NEW__PointerMoveSelectionEventHandler(flow));
    this.register('keyboardMoveSelection', new KeyboardMoveSelectionEventHandler(flow));
    this.register('resize', new __NEW__ResizeEventHandler(flow));
    this.register('paste', new __NEW__PasteEventHandler(flow));
    this.register('deleteSelection', new __NEW__DeleteSelectionEventHandler(flow));
  }
}
