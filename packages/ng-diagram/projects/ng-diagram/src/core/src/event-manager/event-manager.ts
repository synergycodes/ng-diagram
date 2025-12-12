import type { EventListener, UnsubscribeFn } from './event-types';
import type { InternalDiagramEventMap } from './internal-event-types';

/** @internal */
export const EVENT_LISTENER_ERROR = (event: string, listenerType: 'once' | 'on', error: unknown) =>
  `[ngDiagram] Event listener error: Listener for "${event}" event threw an error.

Event: ${event}
Listener type: ${listenerType}
Error: ${error instanceof Error ? error.message : String(error)}

This indicates an error in your event listener callback.
Check your event listener implementation for the "${event}" event.
The diagram will continue to function, but this listener failed to execute.`;

interface ListenerEntry {
  callback: EventListener<InternalDiagramEventMap[keyof InternalDiagramEventMap]>;
  once: boolean;
}

interface DeferredEmit {
  event: keyof InternalDiagramEventMap;
  payload: InternalDiagramEventMap[keyof InternalDiagramEventMap];
}

/**
 * Manages event subscriptions and emissions for the diagram
 */
export class EventManager {
  private listeners = new Map<keyof InternalDiagramEventMap, Set<ListenerEntry>>();
  private enabled = true;
  private deferredEmits: DeferredEmit[] = [];

  /**
   * Subscribe to an event
   * @param event The event name
   * @param callback The callback to invoke when the event is emitted
   * @returns A function to unsubscribe
   */
  on<K extends keyof InternalDiagramEventMap>(
    event: K,
    callback: EventListener<InternalDiagramEventMap[K]>
  ): UnsubscribeFn {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const entry: ListenerEntry = {
      callback: callback as EventListener<InternalDiagramEventMap[keyof InternalDiagramEventMap]>,
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
  once<K extends keyof InternalDiagramEventMap>(
    event: K,
    callback: EventListener<InternalDiagramEventMap[K]>
  ): UnsubscribeFn {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const entry: ListenerEntry = {
      callback: callback as EventListener<InternalDiagramEventMap[keyof InternalDiagramEventMap]>,
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
  emit<K extends keyof InternalDiagramEventMap>(event: K, payload: InternalDiagramEventMap[K]): void {
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
        listener.callback(payload as InternalDiagramEventMap[keyof InternalDiagramEventMap]);

        if (listener.once) {
          listenersToRemove.push(listener);
        }
      } catch (error) {
        console.error(EVENT_LISTENER_ERROR(String(event), listener.once ? 'once' : 'on', error));
      }
    }

    listenersToRemove.forEach((listener) => {
      eventListeners.delete(listener);
    });
  }

  /**
   * Queue an event to be emitted later
   * @param event The event name
   * @param payload The event payload
   */
  deferredEmit<K extends keyof InternalDiagramEventMap>(event: K, payload: InternalDiagramEventMap[K]): void {
    if (!this.enabled) {
      return;
    }

    this.deferredEmits.push({
      event,
      payload: payload as InternalDiagramEventMap[keyof InternalDiagramEventMap],
    });
  }

  /**
   * Remove all listeners for an event, or a specific listener
   * @param event The event name
   * @param callback Optional specific callback to remove
   */
  off<K extends keyof InternalDiagramEventMap>(event: K, callback?: EventListener<InternalDiagramEventMap[K]>): void {
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
  hasListeners(event: keyof InternalDiagramEventMap): boolean {
    return this.listeners.has(event) && this.listeners.get(event)!.size > 0;
  }

  /**
   * Flush all deferred emits
   */
  flushDeferredEmits(): void {
    const emitsToFlush = [...this.deferredEmits];
    this.deferredEmits = [];

    for (const { event, payload } of emitsToFlush) {
      this.emit(event, payload);
    }
  }

  /**
   * Clear all deferred emits without executing them
   */
  clearDeferredEmits(): void {
    this.deferredEmits = [];
  }

  private removeListener<K extends keyof InternalDiagramEventMap>(event: K, entry: ListenerEntry): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(entry);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }
}
