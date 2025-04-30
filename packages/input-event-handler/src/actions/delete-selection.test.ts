import {
  CommandHandler,
  EnvironmentInfo,
  Event,
  FlowCore,
  InputEventHandler,
  KeyboardEvent,
  PointerEvent,
} from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteSelectionAction } from './delete-selection';

describe('deleteSelectionAction', () => {
  const environment: EnvironmentInfo = {
    os: 'windows',
    deviceType: 'desktop',
    browser: 'chrome',
  };
  let mockCommandHandler: CommandHandler;
  let mockEvent: Event;
  let mockInputEventHandler: InputEventHandler;
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    mockFlowCore = {} as FlowCore;

    mockCommandHandler = {
      emit: vi.fn(),
      flowCore: mockFlowCore,
    } as unknown as CommandHandler;

    mockEvent = {
      type: 'keydown',
      timestamp: Date.now(),
      target: null,
      key: 'ArrowRight',
      code: 'ArrowRight',
    } as KeyboardEvent;

    mockInputEventHandler = {
      commandHandler: mockCommandHandler,
    } as unknown as InputEventHandler;
  });

  describe('predicate', () => {
    it('should return true for backspace or delete key', () => {
      (mockEvent as KeyboardEvent).key = 'Backspace';
      expect(deleteSelectionAction.predicate(mockEvent, mockInputEventHandler)).toBe(true);
      (mockEvent as KeyboardEvent).key = 'Delete';
      expect(deleteSelectionAction.predicate(mockEvent, mockInputEventHandler)).toBe(true);
    });

    it('should return false for other keys', () => {
      (mockEvent as KeyboardEvent).key = 'ArrowLeft';
      expect(deleteSelectionAction.predicate(mockEvent, mockInputEventHandler)).toBe(false);
    });

    it('should return false for other event types', () => {
      mockEvent = {
        ...mockEvent,
        type: 'pointerdown',
      } as unknown as PointerEvent;
      expect(deleteSelectionAction.predicate(mockEvent, mockInputEventHandler)).toBe(false);
    });
  });

  describe('action', () => {
    it('should emit deleteSelection command', () => {
      deleteSelectionAction.action(mockEvent as KeyboardEvent, mockInputEventHandler, environment);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('deleteSelection');
    });
  });
});
