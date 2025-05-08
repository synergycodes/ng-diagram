import {
  CommandHandler,
  EnvironmentInfo,
  FlowCore,
  InputEventHandler,
  KeyboardEvent,
  PointerEvent,
} from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteSelectionAction } from '../delete-selection';

describe('deleteSelectionAction', () => {
  const environment: EnvironmentInfo = { os: 'Windows', browser: 'Chrome' };
  let mockCommandHandler: CommandHandler;
  let mockEvent: KeyboardEvent;
  let mockInputEventHandler: InputEventHandler;
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    mockFlowCore = {} as FlowCore;
    mockCommandHandler = { emit: vi.fn(), flowCore: mockFlowCore } as unknown as CommandHandler;
    mockEvent = {
      type: 'keydown',
      timestamp: Date.now(),
      target: { type: 'diagram' },
      key: 'ArrowRight',
      code: 'ArrowRight',
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    };
    mockInputEventHandler = {
      commandHandler: mockCommandHandler,
    } as unknown as InputEventHandler;
  });

  describe('predicate', () => {
    it('should return true for backspace or delete key', () => {
      (mockEvent as KeyboardEvent).key = 'Backspace';
      expect(deleteSelectionAction.predicate(mockEvent, mockInputEventHandler, environment)).toBe(true);
      (mockEvent as KeyboardEvent).key = 'Delete';
      expect(deleteSelectionAction.predicate(mockEvent, mockInputEventHandler, environment)).toBe(true);
    });

    it('should return false for other keys', () => {
      (mockEvent as KeyboardEvent).key = 'ArrowLeft';
      expect(deleteSelectionAction.predicate(mockEvent, mockInputEventHandler, environment)).toBe(false);
    });

    it('should return false for other event types', () => {
      const pointerEvent: PointerEvent = {
        type: 'pointerdown',
        x: 0,
        y: 0,
        pressure: 0,
        target: { type: 'diagram' },
        timestamp: Date.now(),
        button: 0,
      };

      expect(deleteSelectionAction.predicate(pointerEvent, mockInputEventHandler, environment)).toBe(false);
    });
  });

  describe('action', () => {
    it('should emit deleteSelection command', () => {
      deleteSelectionAction.action(mockEvent, mockInputEventHandler, environment);
      expect(mockCommandHandler.emit).toHaveBeenCalledWith('deleteSelection');
    });
  });
});
