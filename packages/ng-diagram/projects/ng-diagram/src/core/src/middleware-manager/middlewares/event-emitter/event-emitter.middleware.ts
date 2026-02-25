import type { EventManager } from '../../../event-manager/event-manager';
import type { Middleware, MiddlewareContext } from '../../../types';
import {
  ClipboardPastedEmitter,
  DiagramInitEmitter,
  EdgeDrawnEmitter,
  EventEmitter,
  GroupMembershipChangedEmitter,
  NodeDragEndedEmitter,
  NodeDragStartedEmitter,
  NodeResizeEndedEmitter,
  NodeResizedEmitter,
  NodeResizeStartedEmitter,
  NodeRotateEndedEmitter,
  NodeRotateStartedEmitter,
  PaletteItemDroppedEmitter,
  SelectionChangedEmitter,
  SelectionGestureEndedEmitter,
  SelectionMovedEmitter,
  SelectionRemovedEmitter,
  SelectionRotatedEmitter,
  ViewportChangedEmitter,
} from './emitters';

const EVENT_EMITTER_ERROR = (emitterName: string, actionTypes: string[], error: unknown) =>
  `[ngDiagram] Event emitter error: ${emitterName} failed.

Action types: ${actionTypes.join(', ')}
Error: ${error instanceof Error ? error.message : String(error)}

This may indicate an issue with event handling logic.
The diagram will continue to function, but some events may not be emitted.
`;

/**
 * Creates an event emitter middleware that analyzes state changes and emits appropriate events.
 * This middleware is designed to run last and leverages the context maps for optimal performance.
 */
export const createEventEmitterMiddleware = (eventManager: EventManager): Middleware => {
  const emitters: EventEmitter[] = [
    new DiagramInitEmitter(),
    new SelectionChangedEmitter(),
    new SelectionGestureEndedEmitter(),
    new SelectionMovedEmitter(),
    new SelectionRemovedEmitter(),
    new GroupMembershipChangedEmitter(),
    new SelectionRotatedEmitter(),
    new ViewportChangedEmitter(),
    new EdgeDrawnEmitter(),
    new ClipboardPastedEmitter(),
    new NodeResizedEmitter(),
    new PaletteItemDroppedEmitter(),
    new NodeResizeStartedEmitter(),
    new NodeResizeEndedEmitter(),
    new NodeRotateStartedEmitter(),
    new NodeRotateEndedEmitter(),
    new NodeDragStartedEmitter(),
    new NodeDragEndedEmitter(),
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
          console.error(EVENT_EMITTER_ERROR(emitter.name, context.modelActionTypes, error));
        }
      }
    },
  };
};
