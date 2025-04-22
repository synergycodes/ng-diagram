import type { CommandHandler, Event, EventMapper } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventHandler } from './event-handler';

class MockEventMapper {
  private listener: (event: Event) => void = () => null;

  register(callback: (event: Event) => void): void {
    this.listener = callback;
  }

  emit(event: Event): void {
    this.listener(event);
  }
}

describe('EventHandler', () => {
  let eventHandler: EventHandler;
  let mockCommandHandler: CommandHandler;
  let mockEventMapper: EventMapper;
  let mockDefaultAction: (event: Event) => void;

  beforeEach(() => {
    mockCommandHandler = {} as CommandHandler;
    mockEventMapper = new MockEventMapper();

    eventHandler = new EventHandler(mockCommandHandler, mockEventMapper);
    mockDefaultAction = vi.fn();
    eventHandler.__overwriteDefaultAction('click', { action: mockDefaultAction, predicate: () => true });
  });

  describe('registerDefault', () => {
    it('should call default action only once if registered multiple times', () => {
      eventHandler.registerDefault('click');
      eventHandler.registerDefault('click');
      eventHandler.registerDefault('click');
      mockEventMapper.emit({} as Event);

      expect(mockDefaultAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('unregisterDefault', () => {
    it('should unregister default action for event', () => {
      eventHandler.unregisterDefault('click');
      mockEventMapper.emit({} as Event);

      expect(mockDefaultAction).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register action for event', () => {
      const testAction = vi.fn();

      eventHandler.register(() => true, testAction);
      mockEventMapper.emit({} as Event);

      expect(testAction).toHaveBeenCalled();
    });

    it('should not call an action for event if predicate returns false', () => {
      const testAction = vi.fn();

      eventHandler.register(() => false, testAction);
      mockEventMapper.emit({} as Event);

      expect(testAction).not.toHaveBeenCalled();
    });

    it('should call an action for event for proper predicate', () => {
      const testAction = vi.fn();

      eventHandler.register((event: unknown) => (event as { test: number }).test === 1, testAction);

      mockEventMapper.emit({ test: 1 } as unknown as Event);
      mockEventMapper.emit({ test: 2 } as unknown as Event);

      expect(testAction).toHaveBeenCalledTimes(1);
    });

    it('should call default action if no action is registered for event', () => {
      mockEventMapper.emit({} as Event);

      expect(mockDefaultAction).toHaveBeenCalled();
    });

    it('should call default action if new action is registered for event', () => {
      eventHandler.register(() => true, 'click');
      mockEventMapper.emit({} as Event);

      expect(mockDefaultAction).toHaveBeenCalledTimes(2);
    });
  });

  describe('unregister', () => {
    it('should unregister action for event', () => {
      const testAction = vi.fn();

      const predicate = () => true;
      eventHandler.register(predicate, testAction);
      eventHandler.unregister(predicate, testAction);

      mockEventMapper.emit({} as Event);

      expect(testAction).not.toHaveBeenCalled();
    });

    it('should unregister newly registered default action by name', () => {
      const predicate = () => true;
      eventHandler.register(predicate, 'click');
      eventHandler.unregister(predicate, 'click');

      mockEventMapper.emit({} as Event);

      expect(mockDefaultAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('invoke', () => {
    it('should call default action if invoked and nothing was emitted', () => {
      eventHandler.invoke('click', {} as Event);

      expect(mockDefaultAction).toHaveBeenCalled();
    });

    it('should call default action even if it was unregistered', () => {
      eventHandler.unregisterDefault('click');
      eventHandler.invoke('click', {} as Event);

      expect(mockDefaultAction).toHaveBeenCalled();
    });
  });
});
