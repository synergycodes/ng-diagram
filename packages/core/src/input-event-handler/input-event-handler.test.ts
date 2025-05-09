import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../flow-core';
import { mockEnvironment } from '../test-utils';
import type { Event } from '../types';
import { inputActions } from './input-actions';
import { InputEventHandler } from './input-event-handler';

vi.mock('./input-actions', async () => ({
  inputActions: {
    select: {
      action: vi.fn(),
      predicate: () => true,
    },
  },
}));

class MockEventMapper {
  private listener: (event: Event) => void = () => null;

  register(callback: (event: Event) => void): void {
    this.listener = callback;
  }

  emit(event: Event): void {
    this.listener(event);
  }
}

describe('InputEventHandler', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockFlowCore: FlowCore;
  let eventHandler: InputEventHandler;
  let mockEventMapper: MockEventMapper;

  beforeEach(() => {
    mockEventMapper = new MockEventMapper();
    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      registerEventsHandler: (handle: (event: Event) => void) => mockEventMapper.register(handle),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
      eventMapper: mockEventMapper,
    } as unknown as FlowCore;
    eventHandler = new InputEventHandler(mockFlowCore);
    vi.clearAllMocks();
  });

  describe('registerDefault', () => {
    it('should call default action only once if registered multiple times', () => {
      eventHandler.registerDefault('select');
      eventHandler.registerDefault('select');
      eventHandler.registerDefault('select');
      mockEventMapper.emit({} as Event);

      expect(inputActions.select.action).toHaveBeenCalledTimes(1);
    });
  });

  describe('unregisterDefault', () => {
    it('should unregister default action for event', () => {
      eventHandler.unregisterDefault('select');
      mockEventMapper.emit({} as Event);

      expect(inputActions.select.action).not.toHaveBeenCalled();
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

      expect(inputActions.select.action).toHaveBeenCalled();
    });

    it('should call default action if new action is registered for event', () => {
      eventHandler.register(() => true, 'select');
      mockEventMapper.emit({} as Event);

      expect(inputActions.select.action).toHaveBeenCalledTimes(2);
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
      eventHandler.register(predicate, 'select');
      eventHandler.unregister(predicate, 'select');

      mockEventMapper.emit({} as Event);

      expect(inputActions.select.action).toHaveBeenCalledTimes(1);
    });
  });

  describe('invoke', () => {
    it('should invoke default action', () => {
      eventHandler.invoke('select', {} as Event);

      expect(inputActions.select.action).toHaveBeenCalled();
    });
  });
});
