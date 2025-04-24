import type { Command, CommandCallback, CommandHandler } from './types/command-handler.interface';

/**
 * Core implementation of CommandHandler interface
 * Handles event emission and registration of callbacks for system events
 */
export class CoreCommandHandler implements CommandHandler {
  private callbacks = new Map<Command['type'], CommandCallback[]>();

  /**
   * Emit a system event to all registered callbacks for the event type
   * @param event Event to emit
   */
  emit(event: Command): void {
    const callbacks = this.callbacks.get(event.type);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(event);
      }
    }
  }

  /**
   * Register a callback for specific event types
   * @param eventType Type of event to listen for
   * @param callback Function to be called when event occurs
   * @returns Function to unregister the callback
   */
  register(eventType: Command['type'], callback: CommandCallback): () => void {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, []);
    }

    const callbacks = this.callbacks.get(eventType) as CommandCallback[];
    callbacks.push(callback);

    // Return unregister function
    return () => {
      const callbacks = this.callbacks.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
          if (callbacks.length === 0) {
            this.callbacks.delete(eventType);
          }
        }
      }
    };
  }
}
