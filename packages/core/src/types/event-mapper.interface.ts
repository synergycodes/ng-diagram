import type { Event } from './event.interface';

/**
 * Type for event listener callback function
 */
export type EventListener = (event: Event) => void;

/**
 * Interface for handling UI-agnostic events
 */
export interface EventMapper {
  /**
   * Register an event listener for a specific event type
   * @param eventListener Event listener to register
   */
  register(eventListener: EventListener): void;

  /**
   * Emit an event to all registered listeners
   * @param event Event to emit
   */
  emit(event: Event): void;
}
