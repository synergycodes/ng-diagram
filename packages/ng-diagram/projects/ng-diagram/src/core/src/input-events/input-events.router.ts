import { FlowCore } from '../flow-core';
import { CopyEventHandler } from './handlers/copy/copy.handler';
import { CutEventHandler } from './handlers/cut/cut.handler';
import { DeleteSelectionEventHandler } from './handlers/delete-selection/delete-selection.handler';
import { EventHandler } from './handlers/event-handler';
import { KeyboardMoveSelectionEventHandler } from './handlers/keyboard-move-selection/keyboard-move-selection.handler';
import { KeyboardPanningEventHandler } from './handlers/keyboard-panning/keyboard-panning.handler';
import { LinkingEventHandler } from './handlers/linking/linking.handler';
import { PaletteDropEventHandler } from './handlers/palette-drop/palette-drop.handler';
import { PanningEventHandler } from './handlers/panning/panning.handler';
import { PasteEventHandler } from './handlers/paste/paste.handler';
import { PointerMoveSelectionEventHandler } from './handlers/pointer-move-selection/pointer-move-selection.handler';
import { ResizeEventHandler } from './handlers/resize/resize.handler';
import { RotateEventHandler } from './handlers/rotate/rotate.handler';
import { SelectEventHandler } from './handlers/select/select.handler';
import { ZoomingEventHandler } from './handlers/zooming/zooming.handler';
import { BaseInputEvent, InputEventName } from './input-events.interface';

export abstract class InputEventsRouter {
  private handlers: Partial<Record<InputEventName, EventHandler<BaseInputEvent>>> = {};

  emit<TEvent extends BaseInputEvent>(event: TEvent) {
    const handler = this.handlers[event.name];
    if (!handler) {
      console.warn(`No handler registered for event: ${event.name}`);
      return;
    }

    return handler.handle(event as BaseInputEvent);
  }

  register<K extends InputEventName>(eventName: K, handler: EventHandler<BaseInputEvent>) {
    this.handlers[eventName] = handler;
  }

  registerDefaultCallbacks(flow: FlowCore) {
    this.register('copy', new CopyEventHandler(flow));
    this.register('select', new SelectEventHandler(flow));
    this.register('panning', new PanningEventHandler(flow));
    this.register('keyboardPanning', new KeyboardPanningEventHandler(flow));
    this.register('pointerMoveSelection', new PointerMoveSelectionEventHandler(flow));
    this.register('keyboardMoveSelection', new KeyboardMoveSelectionEventHandler(flow));
    this.register('resize', new ResizeEventHandler(flow));
    this.register('paste', new PasteEventHandler(flow));
    this.register('deleteSelection', new DeleteSelectionEventHandler(flow));
    this.register('zoom', new ZoomingEventHandler(flow));
    this.register('linking', new LinkingEventHandler(flow));
    this.register('rotate', new RotateEventHandler(flow));
    this.register('paletteDrop', new PaletteDropEventHandler(flow));
    this.register('cut', new CutEventHandler(flow));
  }
}
