import {
  CommandHandler,
  EnvironmentInfo,
  EventTarget,
  FlowCore,
  InputEventHandler,
  KeyboardEvent,
} from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockedNode } from '../../test-utils';
import { keyboardMoveSelectionAction } from '../keyboard-move-selection';

describe('keyboardMoveSelectionAction', () => {
  let mockCommandHandler: CommandHandler;
  let mockEvent: KeyboardEvent;
  let mockTarget: EventTarget;
  let mockInputEventHandler: InputEventHandler;
  let mockFlowCore: FlowCore;
  const environment: EnvironmentInfo = {
    os: 'windows',
    deviceType: 'desktop',
    browser: 'chrome',
  };

  beforeEach(() => {
    mockFlowCore = {} as FlowCore;

    mockCommandHandler = {
      emit: vi.fn(),
      flowCore: mockFlowCore,
    } as unknown as CommandHandler;

    mockTarget = { type: 'node', element: mockedNode };

    mockEvent = {
      type: 'keydown',
      timestamp: Date.now(),
      target: mockTarget,
      key: 'ArrowRight',
      code: 'ArrowRight',
    } as KeyboardEvent;

    mockInputEventHandler = {
      commandHandler: mockCommandHandler,
    } as unknown as InputEventHandler;
  });

  describe('predicate', () => {
    it('should return true for keydown events', () => {
      expect(keyboardMoveSelectionAction.predicate(mockEvent, mockInputEventHandler, environment)).toBe(true);
    });

    it('should return false for none of the expecting key keydown event', () => {
      expect(
        keyboardMoveSelectionAction.predicate({ ...mockEvent, key: 'A' }, mockInputEventHandler, environment)
      ).toBe(false);
    });

    it('should return false for non-keydown events', () => {
      expect(
        keyboardMoveSelectionAction.predicate({ ...mockEvent, type: 'keypress' }, mockInputEventHandler, environment)
      ).toBe(false);
    });
  });

  describe('action', () => {
    it('should emit moveSelection command with correct dx and dy for ArrowRight', () => {
      keyboardMoveSelectionAction.action(mockEvent, mockInputEventHandler, environment);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveSelection', {
        dx: 10,
        dy: 0,
      });
    });

    it('should emit moveSelection command with correct dx and dy for ArrowLeft', () => {
      mockEvent = {
        ...mockEvent,
        key: 'ArrowLeft',
        code: 'ArrowLeft',
      } as KeyboardEvent;

      keyboardMoveSelectionAction.action(mockEvent, mockInputEventHandler, environment);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveSelection', {
        dx: -10,
        dy: 0,
      });
    });

    it('should emit moveSelection command with correct dx and dy for ArrowUp', () => {
      mockEvent = {
        ...mockEvent,
        key: 'ArrowUp',
        code: 'ArrowUp',
      } as KeyboardEvent;

      keyboardMoveSelectionAction.action(mockEvent, mockInputEventHandler, environment);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveSelection', {
        dx: 0,
        dy: -10,
      });
    });

    it('should emit moveSelection command with correct dx and dy for ArrowDown', () => {
      mockEvent = {
        ...mockEvent,
        key: 'ArrowDown',
        code: 'ArrowDown',
      } as KeyboardEvent;

      keyboardMoveSelectionAction.action(mockEvent, mockInputEventHandler, environment);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveSelection', {
        dx: 0,
        dy: 10,
      });
    });

    it('should only trigger for keydown events', () => {
      const keyupEvent = {
        ...mockEvent,
        type: 'keyup',
      } as KeyboardEvent;

      expect(keyboardMoveSelectionAction.predicate(mockEvent, mockInputEventHandler, environment)).toBe(true);
      expect(keyboardMoveSelectionAction.predicate(keyupEvent, mockInputEventHandler, environment)).toBe(false);
    });
  });
});
