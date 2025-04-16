import type { CommandInterpreter, SystemEvent, SystemEventCallback } from './types/command-interpreter.interface';

/**
 * Core implementation of CommandInterpreter interface
 * Handles event emission and registration of callbacks for system events
 */
export class CoreCommandInterpreter implements CommandInterpreter {
  private callbacks: Map<SystemEvent['type'], SystemEventCallback[]> = new Map();

  /**
   * Emit a system event to all registered callbacks for the event type
   * @param event Event to emit
   */
  emit(event: SystemEvent): void {
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
  register(eventType: SystemEvent['type'], callback: SystemEventCallback): () => void {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, []);
    }

    const callbacks = this.callbacks.get(eventType) as SystemEventCallback[];
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
