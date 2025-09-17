import type { EventManager } from '../../../../event-manager/event-manager';
import type { MiddlewareContext } from '../../../../types';

/**
 * Base interface for event emitters
 */
export interface EventEmitter {
  /**
   * Name of the event emitter for debugging
   */
  name: string;

  /**
   * Analyzes the context and emits events if conditions are met
   * @param context The middleware context with all state information
   * @param finalState The final state after all middlewares
   * @param eventManager The event manager to emit events
   */
  emit(context: MiddlewareContext, eventManager: EventManager): void;
}
