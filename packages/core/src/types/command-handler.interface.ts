/**
 * Type for system events that can be emitted by EventHandler or Model
 */
export type SystemEvent =
  | { type: 'command'; name: string; data?: unknown }
  | { type: 'modelChange'; action: string; data?: unknown };

/**
 * Type for event callback function
 */
export type SystemEventCallback = (event: SystemEvent) => void;

/**
 * Interface for interpreting and routing system events
 * This is a core component that handles events from EventHandler and Model
 */
export interface CommandHandler {
  /**
   * Emit a system event
   * @param event Event to emit
   */
  emit(event: SystemEvent): void;

  /**
   * Register a callback for specific event types
   * @param eventType Type of event to listen for
   * @param callback Function to be called when event occurs
   * @returns Function to unregister the callback
   */
  register(eventType: SystemEvent['type'], callback: SystemEventCallback): () => void;
}
