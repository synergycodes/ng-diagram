import type { DiagramEventMap, EventListener, UnsubscribeFn } from './event-types';

interface ListenerEntry {
  callback: EventListener<DiagramEventMap[keyof DiagramEventMap]>;
  once: boolean;
}

/**
 * Manages event subscriptions and emissions for the diagram
 */
export class EventManager {
  private listeners = new Map<keyof DiagramEventMap, Set<ListenerEntry>>();
  private enabled = true;

  /**
   * Subscribe to an event
   * @param event The event name
   * @param callback The callback to invoke when the event is emitted
   * @returns A function to unsubscribe
   */
  on<K extends keyof DiagramEventMap>(event: K, callback: EventListener<DiagramEventMap[K]>): UnsubscribeFn {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const entry: ListenerEntry = {
      callback: callback as EventListener<DiagramEventMap[keyof DiagramEventMap]>,
      once: false,
    };

    this.listeners.get(event)!.add(entry);

    return () => this.removeListener(event, entry);
  }

  /**
   * Subscribe to an event that will only fire once
   * @param event The event name
   * @param callback The callback to invoke when the event is emitted
   * @returns A function to unsubscribe
   */
  once<K extends keyof DiagramEventMap>(event: K, callback: EventListener<DiagramEventMap[K]>): UnsubscribeFn {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const entry: ListenerEntry = {
      callback: callback as EventListener<DiagramEventMap[keyof DiagramEventMap]>,
      once: true,
    };

    this.listeners.get(event)!.add(entry);

    return () => this.removeListener(event, entry);
  }

  /**
   * Emit an event
   * @param event The event name
   * @param payload The event payload
   */
  emit<K extends keyof DiagramEventMap>(event: K, payload: DiagramEventMap[K]): void {
    if (!this.enabled) {
      return;
    }

    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.size === 0) {
      return;
    }

    const listenersToRemove: ListenerEntry[] = [];

    for (const listener of eventListeners) {
      try {
        listener.callback(payload as DiagramEventMap[keyof DiagramEventMap]);

        if (listener.once) {
          listenersToRemove.push(listener);
        }
      } catch (error) {
        console.error(`Error in event listener for "${String(event)}":`, error);
      }
    }

    listenersToRemove.forEach((listener) => {
      eventListeners.delete(listener);
    });
  }

  /**
   * Remove all listeners for an event, or a specific listener
   * @param event The event name
   * @param callback Optional specific callback to remove
   */
  off<K extends keyof DiagramEventMap>(event: K, callback?: EventListener<DiagramEventMap[K]>): void {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    const toRemove = Array.from(eventListeners).find((entry) => entry.callback === callback);

    if (toRemove) {
      eventListeners.delete(toRemove);
    }
  }

  /**
   * Remove all event listeners
   */
  offAll(): void {
    this.listeners.clear();
  }

  /**
   * Enable or disable event emissions
   * @param enabled Whether events should be emitted
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if event emissions are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if there are any listeners for an event
   * @param event The event name
   * @returns True if there are listeners
   */
  hasListeners(event: keyof DiagramEventMap): boolean {
    return this.listeners.has(event) && this.listeners.get(event)!.size > 0;
  }

  private removeListener<K extends keyof DiagramEventMap>(event: K, entry: ListenerEntry): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(entry);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }
}
