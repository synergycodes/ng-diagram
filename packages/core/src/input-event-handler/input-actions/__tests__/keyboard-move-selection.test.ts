import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment, mockNode } from '../../../test-utils';
import type { EventTarget, KeyboardEvent } from '../../../types';
import { keyboardMoveSelectionAction } from '../keyboard-move-selection';

describe('keyboardMoveSelectionAction', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockEvent: KeyboardEvent;
  let mockTarget: EventTarget;
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    mockTarget = { type: 'node', element: mockNode };

    mockEvent = {
      type: 'keydown',
      timestamp: Date.now(),
      target: mockTarget,
      key: 'ArrowRight',
      code: 'ArrowRight',
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    } as KeyboardEvent;

    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
      modelLookup: {
        getSelectedNodesWithChildren: vi.fn().mockReturnValue([mockNode]),
      },
    } as unknown as FlowCore;
  });

  describe('predicate', () => {
    it('should return true for keydown events', () => {
      expect(keyboardMoveSelectionAction.predicate(mockEvent, mockFlowCore)).toBe(true);
    });

    it('should return false for none of the expecting key keydown event', () => {
      expect(keyboardMoveSelectionAction.predicate({ ...mockEvent, key: 'A' }, mockFlowCore)).toBe(false);
    });

    it('should return false for non-keydown events', () => {
      expect(keyboardMoveSelectionAction.predicate({ ...mockEvent, type: 'keypress' }, mockFlowCore)).toBe(false);
    });
  });

  describe('action', () => {
    it('should emit moveNodes command with correct dx and dy for ArrowRight', () => {
      keyboardMoveSelectionAction.action(mockEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
        nodes: [mockNode],
        delta: { x: 10, y: 0 },
      });
    });

    it('should emit moveNodes command with correct dx and dy for ArrowLeft', () => {
      mockEvent = {
        ...mockEvent,
        key: 'ArrowLeft',
        code: 'ArrowLeft',
      } as KeyboardEvent;

      keyboardMoveSelectionAction.action(mockEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
        nodes: [mockNode],
        delta: { x: -10, y: 0 },
      });
    });

    it('should emit moveNodes command with correct dx and dy for ArrowUp', () => {
      mockEvent = {
        ...mockEvent,
        key: 'ArrowUp',
        code: 'ArrowUp',
      } as KeyboardEvent;

      keyboardMoveSelectionAction.action(mockEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
        nodes: [mockNode],
        delta: { x: 0, y: -10 },
      });
    });

    it('should emit moveNodes command with correct dx and dy for ArrowDown', () => {
      mockEvent = {
        ...mockEvent,
        key: 'ArrowDown',
        code: 'ArrowDown',
      } as KeyboardEvent;

      keyboardMoveSelectionAction.action(mockEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
        nodes: [mockNode],
        delta: { x: 0, y: 10 },
      });
    });

    it('should not emit command if no nodes are selected', () => {
      // Reset all mocks to ensure clean state
      vi.clearAllMocks();

      // Set up the mock to return empty array
      (mockFlowCore.modelLookup.getSelectedNodesWithChildren as ReturnType<typeof vi.fn>).mockReturnValue([]);

      keyboardMoveSelectionAction.action(mockEvent, mockFlowCore);

      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });

    it('should only trigger for keydown events', () => {
      const keyupEvent = {
        ...mockEvent,
        type: 'keyup',
      } as KeyboardEvent;

      expect(keyboardMoveSelectionAction.predicate(mockEvent, mockFlowCore)).toBe(true);
      expect(keyboardMoveSelectionAction.predicate(keyupEvent, mockFlowCore)).toBe(false);
    });
  });
});
