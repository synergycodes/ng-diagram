import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreCommandHandler } from './command-handler';
import type { Command } from './types/command-handler.interface';

describe('CoreCommandHandler', () => {
  let handler: CoreCommandHandler;

  beforeEach(() => {
    handler = new CoreCommandHandler();
  });

  describe('emit', () => {
    it('should call all registered callbacks for the event type', () => {
      const commandCallback = vi.fn();
      const otherCommandCallback = vi.fn();

      handler.register('select', commandCallback);
      handler.register('unselect', otherCommandCallback);

      const commandEvent: Command = { type: 'select', data: { id: '1' } };
      handler.emit(commandEvent);

      expect(commandCallback).toHaveBeenCalledWith(commandEvent);
      expect(otherCommandCallback).not.toHaveBeenCalled();
    });

    it('should not call any callbacks if none are registered for the event type', () => {
      const callback = vi.fn();
      handler.register('unselect', callback);

      const commandEvent: Command = { type: 'select', data: { id: '1' } };
      handler.emit(commandEvent);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should allow registering multiple callbacks for the same event type', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      handler.register('select', callback1);
      handler.register('select', callback2);

      const event: Command = { type: 'select', data: { id: '1' } };
      handler.emit(event);

      expect(callback1).toHaveBeenCalledWith(event);
      expect(callback2).toHaveBeenCalledWith(event);
    });

    it('should allow registering the same callback multiple times', () => {
      const callback = vi.fn();

      handler.register('select', callback);
      handler.register('select', callback);

      const event: Command = { type: 'select', data: { id: '1' } };
      handler.emit(event);

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should preserve callback order', () => {
      const calls: string[] = [];
      const callback1 = () => calls.push('1');
      const callback2 = () => calls.push('2');

      handler.register('select', callback1);
      handler.register('select', callback2);

      handler.emit({ type: 'select', data: { id: '1' } });

      expect(calls).toEqual(['1', '2']);
    });
  });

  describe('unregister', () => {
    it('should remove the callback when unregister is called', () => {
      const callback = vi.fn();
      const unregister = handler.register('select', callback);

      unregister();
      handler.emit({ type: 'select', data: { id: '1' } });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should only remove the specific callback that was unregistered', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unregister1 = handler.register('select', callback1);
      handler.register('select', callback2);

      unregister1();
      handler.emit({ type: 'select', data: { id: '1' } });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should remove the event type from the map when no callbacks remain', () => {
      const callback = vi.fn();
      const unregister = handler.register('select', callback);

      unregister();
      handler.emit({ type: 'select', data: { id: '1' } });

      // @ts-expect-error - accessing private property for testing
      expect(handler.callbacks.has('select')).toBe(false);
    });

    it('should handle unregistering a callback that was already removed', () => {
      const callback = vi.fn();
      const unregister = handler.register('select', callback);

      unregister();
      unregister(); // Call again, should not throw

      handler.emit({ type: 'select', data: { id: '1' } });
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('event data', () => {
    it('should pass command event data to callbacks', () => {
      const callback = vi.fn();
      handler.register('select', callback);

      handler.emit({ type: 'select', data: { id: '1' } });

      expect(callback).toHaveBeenCalledWith({
        type: 'select',
        data: { id: '1' },
      });
    });

    it('should pass model change event data to callbacks', () => {
      const callback = vi.fn();
      handler.register('select', callback);

      handler.emit({ type: 'select', data: { id: '1' } });

      expect(callback).toHaveBeenCalledWith({
        type: 'select',
        data: { id: '1' },
      });
    });
  });
});
