/**
 * Type for system events that can be emitted by EventHandler or Model
 */
export type Command = { type: 'select'; data: { id: string } } | { type: 'unselect'; data: { id: string } };

/**
 * Type for event callback function
 */
export type CommandCallback = (event: Command) => void;

/**
 * Interface for interpreting and routing system events
 * This is a core component that handles events from EventHandler and Model
 */
export interface CommandHandler {
  /**
   * Emit a system event
   * @param event Event to emit
   */
  emit(event: Command): void;

  /**
   * Register a callback for specific event types
   * @param eventType Type of event to listen for
   * @param callback Function to be called when event occurs
   */
  register(eventType: Command['type'], callback: CommandCallback): void;
}
