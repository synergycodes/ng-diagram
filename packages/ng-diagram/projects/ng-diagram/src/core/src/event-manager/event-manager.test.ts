import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventManager } from './event-manager';
import type { DiagramInitEvent, EdgeDrawnEvent, SelectionMovedEvent } from './event-types';
import type { ActionStateChangedEvent } from './internal-event-types';

describe('EventManager', () => {
  let eventManager: EventManager;

  beforeEach(() => {
    eventManager = new EventManager();
  });

  describe('on()', () => {
    it('should register an event listener', () => {
      const callback = vi.fn();
      eventManager.on('selectionMoved', callback);

      const event: SelectionMovedEvent = {
        nodes: [],
      };

      eventManager.emit('selectionMoved', event);
      expect(callback).toHaveBeenCalledWith(event);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should register multiple listeners for the same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventManager.on('diagramInit', callback1);
      eventManager.on('diagramInit', callback2);

      const event: DiagramInitEvent = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, scale: 1 },
      };

      eventManager.emit('diagramInit', event);
      expect(callback1).toHaveBeenCalledWith(event);
      expect(callback2).toHaveBeenCalledWith(event);
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = eventManager.on('selectionMoved', callback);

      const event: SelectionMovedEvent = {
        nodes: [],
      };

      eventManager.emit('selectionMoved', event);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      eventManager.emit('selectionMoved', event);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle listeners for different event types independently', () => {
      const moveCallback = vi.fn();
      const initCallback = vi.fn();

      eventManager.on('selectionMoved', moveCallback);
      eventManager.on('diagramInit', initCallback);

      const moveEvent: SelectionMovedEvent = {
        nodes: [],
      };

      eventManager.emit('selectionMoved', moveEvent);
      expect(moveCallback).toHaveBeenCalledWith(moveEvent);
      expect(initCallback).not.toHaveBeenCalled();
    });
  });

  describe('once()', () => {
    it('should register a one-time listener', () => {
      const callback = vi.fn();
      eventManager.once('edgeDrawn', callback);

      const event: EdgeDrawnEvent = {
        edge: { id: '1', source: 'n1', target: 'n2', data: {} },
        source: { id: 'n1', position: { x: 0, y: 0 }, data: {} },
        target: { id: 'n2', position: { x: 100, y: 100 }, data: {} },
      };

      eventManager.emit('edgeDrawn', event);
      expect(callback).toHaveBeenCalledTimes(1);

      eventManager.emit('edgeDrawn', event);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should allow unsubscribing a one-time listener before it fires', () => {
      const callback = vi.fn();
      const unsubscribe = eventManager.once('edgeDrawn', callback);

      unsubscribe();

      const event: EdgeDrawnEvent = {
        edge: { id: '1', source: 'n1', target: 'n2', data: {} },
        source: { id: 'n1', position: { x: 0, y: 0 }, data: {} },
        target: { id: 'n2', position: { x: 100, y: 100 }, data: {} },
      };

      eventManager.emit('edgeDrawn', event);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle mix of once and regular listeners', () => {
      const onceCallback = vi.fn();
      const regularCallback = vi.fn();

      eventManager.once('selectionMoved', onceCallback);
      eventManager.on('selectionMoved', regularCallback);

      const event: SelectionMovedEvent = {
        nodes: [],
      };

      eventManager.emit('selectionMoved', event);
      expect(onceCallback).toHaveBeenCalledTimes(1);
      expect(regularCallback).toHaveBeenCalledTimes(1);

      eventManager.emit('selectionMoved', event);
      expect(onceCallback).toHaveBeenCalledTimes(1);
      expect(regularCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('emit()', () => {
    it('should emit events to all registered listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventManager.on('viewportChanged', callback1);
      eventManager.on('viewportChanged', callback2);

      const event = {
        viewport: { x: 10, y: 20, scale: 1.5 },
        previousViewport: { x: 0, y: 0, scale: 1 },
      };

      eventManager.emit('viewportChanged', event);
      expect(callback1).toHaveBeenCalledWith(event);
      expect(callback2).toHaveBeenCalledWith(event);
    });

    it('should not emit when disabled', () => {
      const callback = vi.fn();
      eventManager.on('selectionMoved', callback);

      eventManager.setEnabled(false);

      const event: SelectionMovedEvent = {
        nodes: [],
      };

      eventManager.emit('selectionMoved', event);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle errors in listeners gracefully', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const normalCallback = vi.fn();

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      eventManager.on('selectionMoved', errorCallback);
      eventManager.on('selectionMoved', normalCallback);

      const event: SelectionMovedEvent = {
        nodes: [],
      };

      eventManager.emit('selectionMoved', event);

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Error in event listener for "selectionMoved":', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should do nothing when no listeners are registered', () => {
      const event: SelectionMovedEvent = {
        nodes: [],
      };

      expect(() => eventManager.emit('selectionMoved', event)).not.toThrow();
    });
  });

  describe('off()', () => {
    it('should remove all listeners for an event when no callback provided', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventManager.on('selectionMoved', callback1);
      eventManager.on('selectionMoved', callback2);

      eventManager.off('selectionMoved');

      const event: SelectionMovedEvent = {
        nodes: [],
      };

      eventManager.emit('selectionMoved', event);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should remove specific listener when callback provided', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventManager.on('selectionMoved', callback1);
      eventManager.on('selectionMoved', callback2);

      eventManager.off('selectionMoved', callback1);

      const event: SelectionMovedEvent = {
        nodes: [],
      };

      eventManager.emit('selectionMoved', event);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should handle removing non-existent listener gracefully', () => {
      const callback = vi.fn();
      expect(() => eventManager.off('selectionMoved', callback)).not.toThrow();
    });

    it('should handle removing from non-existent event gracefully', () => {
      expect(() => eventManager.off('selectionMoved')).not.toThrow();
    });
  });

  describe('offAll()', () => {
    it('should remove all listeners for all events', () => {
      const moveCallback = vi.fn();
      const initCallback = vi.fn();
      const edgeCallback = vi.fn();

      eventManager.on('selectionMoved', moveCallback);
      eventManager.on('diagramInit', initCallback);
      eventManager.on('edgeDrawn', edgeCallback);

      eventManager.offAll();

      eventManager.emit('selectionMoved', {
        nodes: [],
      });
      eventManager.emit('diagramInit', {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, scale: 1 },
      });
      eventManager.emit('edgeDrawn', {
        edge: { id: '1', source: 'n1', target: 'n2', data: {} },
        source: { id: 'n1', position: { x: 0, y: 0 }, data: {} },
        target: { id: 'n2', position: { x: 100, y: 100 }, data: {} },
      });

      expect(moveCallback).not.toHaveBeenCalled();
      expect(initCallback).not.toHaveBeenCalled();
      expect(edgeCallback).not.toHaveBeenCalled();
    });
  });

  describe('setEnabled() / isEnabled()', () => {
    it('should enable and disable event emissions', () => {
      expect(eventManager.isEnabled()).toBe(true);

      eventManager.setEnabled(false);
      expect(eventManager.isEnabled()).toBe(false);

      eventManager.setEnabled(true);
      expect(eventManager.isEnabled()).toBe(true);
    });

    it('should prevent emissions when disabled', () => {
      const callback = vi.fn();
      eventManager.on('selectionMoved', callback);

      eventManager.setEnabled(false);
      eventManager.emit('selectionMoved', {
        nodes: [],
      });
      expect(callback).not.toHaveBeenCalled();

      eventManager.setEnabled(true);
      eventManager.emit('selectionMoved', {
        nodes: [],
      });
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('hasListeners()', () => {
    it('should return true when listeners exist', () => {
      eventManager.on('selectionMoved', vi.fn());
      expect(eventManager.hasListeners('selectionMoved')).toBe(true);
    });

    it('should return false when no listeners exist', () => {
      expect(eventManager.hasListeners('selectionMoved')).toBe(false);
    });

    it('should return false after all listeners removed', () => {
      const callback = vi.fn();
      eventManager.on('selectionMoved', callback);
      expect(eventManager.hasListeners('selectionMoved')).toBe(true);

      eventManager.off('selectionMoved', callback);
      expect(eventManager.hasListeners('selectionMoved')).toBe(false);
    });

    it('should track listeners per event type independently', () => {
      eventManager.on('selectionMoved', vi.fn());
      expect(eventManager.hasListeners('selectionMoved')).toBe(true);
      expect(eventManager.hasListeners('diagramInit')).toBe(false);
    });
  });

  describe('deferredEmit() / flushDeferredEmits() / clearDeferredEmits()', () => {
    it('should queue events and flush them later', () => {
      const callback = vi.fn();
      eventManager.on('selectionMoved', callback);

      const event1: SelectionMovedEvent = {
        nodes: [{ id: 'n1', position: { x: 10, y: 10 }, data: {} }],
      };
      const event2: SelectionMovedEvent = {
        nodes: [{ id: 'n2', position: { x: 20, y: 20 }, data: {} }],
      };

      eventManager.deferredEmit('selectionMoved', event1);
      eventManager.deferredEmit('selectionMoved', event2);

      expect(callback).not.toHaveBeenCalled();

      eventManager.flushDeferredEmits();

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(1, event1);
      expect(callback).toHaveBeenNthCalledWith(2, event2);
    });

    it('should queue different event types', () => {
      const moveCallback = vi.fn();
      const initCallback = vi.fn();

      eventManager.on('selectionMoved', moveCallback);
      eventManager.on('diagramInit', initCallback);

      const moveEvent: SelectionMovedEvent = {
        nodes: [],
      };
      const initEvent: DiagramInitEvent = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, scale: 1 },
      };

      eventManager.deferredEmit('selectionMoved', moveEvent);
      eventManager.deferredEmit('diagramInit', initEvent);

      expect(moveCallback).not.toHaveBeenCalled();
      expect(initCallback).not.toHaveBeenCalled();

      eventManager.flushDeferredEmits();

      expect(moveCallback).toHaveBeenCalledWith(moveEvent);
      expect(initCallback).toHaveBeenCalledWith(initEvent);
    });

    it('should clear deferred emits after flushing', () => {
      const callback = vi.fn();
      eventManager.on('selectionMoved', callback);

      const event: SelectionMovedEvent = {
        nodes: [],
      };

      eventManager.deferredEmit('selectionMoved', event);
      eventManager.flushDeferredEmits();

      expect(callback).toHaveBeenCalledTimes(1);

      eventManager.flushDeferredEmits();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should clear deferred emits without executing them', () => {
      const callback = vi.fn();
      eventManager.on('selectionMoved', callback);

      const event: SelectionMovedEvent = {
        nodes: [],
      };

      eventManager.deferredEmit('selectionMoved', event);
      eventManager.clearDeferredEmits();

      expect(callback).not.toHaveBeenCalled();

      eventManager.flushDeferredEmits();
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not queue events when disabled', () => {
      const callback = vi.fn();
      eventManager.on('selectionMoved', callback);

      eventManager.setEnabled(false);

      const event: SelectionMovedEvent = {
        nodes: [],
      };

      eventManager.deferredEmit('selectionMoved', event);
      eventManager.setEnabled(true);
      eventManager.flushDeferredEmits();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should maintain order of deferred emits', () => {
      const callback = vi.fn();
      eventManager.on('selectionMoved', callback);

      const events = Array.from({ length: 5 }, (_, i) => ({
        nodes: [{ id: `n${i}`, position: { x: i, y: i }, data: {} }],
      }));

      events.forEach((event) => eventManager.deferredEmit('selectionMoved', event));

      eventManager.flushDeferredEmits();

      expect(callback).toHaveBeenCalledTimes(5);
      events.forEach((event, i) => {
        expect(callback).toHaveBeenNthCalledWith(i + 1, event);
      });
    });

    it('should handle mix of regular emit and deferred emit', () => {
      const callback = vi.fn();
      eventManager.on('selectionMoved', callback);

      const event1: SelectionMovedEvent = { nodes: [] };
      const event2: SelectionMovedEvent = { nodes: [{ id: 'n1', position: { x: 0, y: 0 }, data: {} }] };
      const event3: SelectionMovedEvent = { nodes: [{ id: 'n2', position: { x: 1, y: 1 }, data: {} }] };

      eventManager.emit('selectionMoved', event1);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(event1);

      eventManager.deferredEmit('selectionMoved', event2);
      eventManager.deferredEmit('selectionMoved', event3);
      expect(callback).toHaveBeenCalledTimes(1);

      eventManager.flushDeferredEmits();
      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(2, event2);
      expect(callback).toHaveBeenNthCalledWith(3, event3);
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple subscriptions and unsubscriptions', () => {
      const callbacks = [vi.fn(), vi.fn(), vi.fn()];
      const unsubscribes = callbacks.map((cb) => eventManager.on('selectionMoved', cb));

      const event: SelectionMovedEvent = {
        nodes: [],
      };

      eventManager.emit('selectionMoved', event);
      callbacks.forEach((cb) => expect(cb).toHaveBeenCalledTimes(1));

      unsubscribes[1]();
      eventManager.emit('selectionMoved', event);
      expect(callbacks[0]).toHaveBeenCalledTimes(2);
      expect(callbacks[1]).toHaveBeenCalledTimes(1);
      expect(callbacks[2]).toHaveBeenCalledTimes(2);
    });

    it('should handle listener that unsubscribes itself', () => {
      // eslint-disable-next-line prefer-const
      let unsubscribe: (() => void) | undefined;
      const selfUnsubscribingCallback = vi.fn(() => {
        unsubscribe?.();
      });

      unsubscribe = eventManager.on('selectionMoved', selfUnsubscribingCallback);

      const event: SelectionMovedEvent = {
        nodes: [],
      };

      eventManager.emit('selectionMoved', event);
      expect(selfUnsubscribingCallback).toHaveBeenCalledTimes(1);

      eventManager.emit('selectionMoved', event);
      expect(selfUnsubscribingCallback).toHaveBeenCalledTimes(1);
    });

    it('should properly clean up empty event listener sets', () => {
      const callback = vi.fn();
      const unsubscribe = eventManager.on('selectionMoved', callback);

      expect(eventManager.hasListeners('selectionMoved')).toBe(true);

      unsubscribe();
      expect(eventManager.hasListeners('selectionMoved')).toBe(false);
    });
  });

  describe('internal events', () => {
    it('should handle actionStateChanged event', () => {
      const callback = vi.fn();
      eventManager.on('actionStateChanged', callback);

      const event: ActionStateChangedEvent = {
        actionState: {
          resize: {
            startWidth: 100,
            startHeight: 100,
            startX: 0,
            startY: 0,
            startNodePositionX: 50,
            startNodePositionY: 50,
            draggingNode: { id: 'n1', position: { x: 0, y: 0 }, data: {} },
          },
        },
      };

      eventManager.emit('actionStateChanged', event);
      expect(callback).toHaveBeenCalledWith(event);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should support deferred emit for actionStateChanged', () => {
      const callback = vi.fn();
      eventManager.on('actionStateChanged', callback);

      const event: ActionStateChangedEvent = {
        actionState: {
          linking: { sourceNodeId: 'n1', sourcePortId: 'p1', temporaryEdge: null },
        },
      };

      eventManager.deferredEmit('actionStateChanged', event);
      expect(callback).not.toHaveBeenCalled();

      eventManager.flushDeferredEmits();
      expect(callback).toHaveBeenCalledWith(event);
    });

    it('should handle actionStateChanged with empty state', () => {
      const callback = vi.fn();
      eventManager.on('actionStateChanged', callback);

      const event: ActionStateChangedEvent = {
        actionState: {},
      };

      eventManager.emit('actionStateChanged', event);
      expect(callback).toHaveBeenCalledWith(event);
    });
  });
});
