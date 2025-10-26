import type { EventManager } from '../../../event-manager/event-manager';
import type { Middleware, MiddlewareContext } from '../../../types';
import {
  ClipboardPastedEmitter,
  DiagramInitEmitter,
  EdgeDrawnEmitter,
  EventEmitter,
  NodeResizedEmitter,
  PaletteItemDroppedEmitter,
  SelectionChangedEmitter,
  SelectionGroupedEmitter,
  SelectionMovedEmitter,
  SelectionRemovedEmitter,
  SelectionRotatedEmitter,
  ViewportChangedEmitter,
} from './emitters';

/**
 * Creates an event emitter middleware that analyzes state changes and emits appropriate events.
 * This middleware is designed to run last and leverages the context maps for optimal performance.
 */
export const createEventEmitterMiddleware = (eventManager: EventManager): Middleware => {
  const emitters: EventEmitter[] = [
    new DiagramInitEmitter(),
    new SelectionChangedEmitter(),
    new SelectionMovedEmitter(),
    new SelectionRemovedEmitter(),
    new SelectionGroupedEmitter(),
    new SelectionRotatedEmitter(),
    new ViewportChangedEmitter(),
    new EdgeDrawnEmitter(),
    new ClipboardPastedEmitter(),
    new NodeResizedEmitter(),
    new PaletteItemDroppedEmitter(),
  ];

  return {
    name: '__internal_event_emitter',
    execute: (context: MiddlewareContext, next) => {
      next();

      if (!eventManager.isEnabled()) {
        return;
      }

      for (const emitter of emitters) {
        try {
          emitter.emit(context, eventManager);
        } catch (error) {
          console.error(`Error in ${emitter.name}:`, error);
        }
      }
    },
  };
};
