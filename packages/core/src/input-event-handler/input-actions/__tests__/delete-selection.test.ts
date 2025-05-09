import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment } from '../../../test-utils';
import type { KeyboardEvent, PointerEvent } from '../../../types';
import { deleteSelectionAction } from '../delete-selection';

describe('deleteSelectionAction', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockEvent: KeyboardEvent;
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    vi.clearAllMocks();
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
    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
    } as unknown as FlowCore;
  });

  describe('predicate', () => {
    it('should return true for backspace or delete key', () => {
      (mockEvent as KeyboardEvent).key = 'Backspace';
      expect(deleteSelectionAction.predicate(mockEvent, mockFlowCore)).toBe(true);
      (mockEvent as KeyboardEvent).key = 'Delete';
      expect(deleteSelectionAction.predicate(mockEvent, mockFlowCore)).toBe(true);
    });

    it('should return false for other keys', () => {
      (mockEvent as KeyboardEvent).key = 'ArrowLeft';
      expect(deleteSelectionAction.predicate(mockEvent, mockFlowCore)).toBe(false);
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

      expect(deleteSelectionAction.predicate(pointerEvent, mockFlowCore)).toBe(false);
    });
  });

  describe('action', () => {
    it('should emit deleteSelection command', () => {
      deleteSelectionAction.action(mockEvent, mockFlowCore);
      expect(mockCommandHandler.emit).toHaveBeenCalledWith('deleteSelection');
    });
  });
});
