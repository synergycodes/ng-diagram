import type { __OLD__InputEvent } from './__old__event/event.interface';

/**
 * Type for event listener callback function
 * @deprecated
 */
export type __OLD__EventListener = (event: __OLD__InputEvent) => void;

/**
 * Interface for handling UI-agnostic events
 * @deprecated We're moving to an event bus approach
 */
export interface EventMapper {
  /**
   * Register an event listener for a specific event type
   * @param eventListener Event listener to register
   */
  register(eventListener: __OLD__EventListener): void;

  /**
   * Emit an event to all registered listeners
   * @param event Event to emit
   */
  emit(...args: unknown[]): void;
}
