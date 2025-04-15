import { Event } from './event.interface';

/**
 * Type for event listener callback function
 */
export type EventListener = (event: Event) => void;

/**
 * Interface for handling UI-agnostic events
 */
export interface EventHandler {
    /**
     * Register an event listener for a specific event type
     * @param type Event type to listen for
     * @param listener Callback function to be called when event occurs
     * @returns A function to unregister the listener
     */
    on(type: string, listener: EventListener): () => void;

    /**
     * Unregister an event listener for a specific event type
     * @param type Event type to unregister from
     * @param listener Callback function to unregister
     */
    off(type: string, listener: EventListener): void;

    /**
     * Register an event listener that will be called only once
     * @param type Event type to listen for
     * @param listener Callback function to be called when event occurs
     * @returns A function to unregister the listener
     */
    once(type: string, listener: EventListener): () => void;

    /**
     * Emit an event to all registered listeners
     * @param event Event to emit
     */
    emit(event: Event): void;
} 