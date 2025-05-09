import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEdge, mockEnvironment, mockNode } from '../../../test-utils';
import type { EventTarget, PointerEvent } from '../../../types';
import { pointerMoveSelectionAction } from '../pointer-move-selection';

describe('pointerMoveSelectionAction', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockEvent: PointerEvent;
  let mockTarget: EventTarget;
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTarget = { type: 'node', element: mockNode };

    mockEvent = {
      button: 0,
      type: 'pointerdown',
      timestamp: Date.now(),
      target: mockTarget,
      x: 100,
      y: 100,
      pressure: 1,
      targetType: 'node',
    } as PointerEvent;

    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
    } as unknown as FlowCore;
  });

  describe('predicate', () => {
    it('should return true for pointerdown events', () => {
      expect(pointerMoveSelectionAction.predicate(mockEvent, mockFlowCore)).toBe(true);
    });

    it('should return true for pointermove events', () => {
      expect(pointerMoveSelectionAction.predicate({ ...mockEvent, type: 'pointermove' }, mockFlowCore)).toBe(true);
    });

    it('should return true for pointerup events', () => {
      expect(pointerMoveSelectionAction.predicate({ ...mockEvent, type: 'pointerup', button: 0 }, mockFlowCore)).toBe(
        true
      );
    });

    it('should return false for other events', () => {
      expect(pointerMoveSelectionAction.predicate({ ...mockEvent, type: 'pointerenter' }, mockFlowCore)).toBe(false);
      expect(pointerMoveSelectionAction.predicate({ ...mockEvent, type: 'pointerleave' }, mockFlowCore)).toBe(false);
    });

    it('should return false for pointerdown events with a non-node target', () => {
      expect(
        pointerMoveSelectionAction.predicate(
          { ...mockEvent, type: 'pointerdown', target: { type: 'edge', element: mockEdge }, button: 0 },
          mockFlowCore
        )
      ).toBe(false);
    });

    it('should return false for pointerdown events with wrong button', () => {
      expect(pointerMoveSelectionAction.predicate({ ...mockEvent, type: 'pointerdown', button: 1 }, mockFlowCore)).toBe(
        false
      );
    });
  });

  describe('action', () => {
    it('should initialize state on pointerdown', () => {
      pointerMoveSelectionAction.action(mockEvent, mockFlowCore);

      const moveEvent = { ...mockEvent, type: 'pointermove' as const, x: 110, y: 110, button: 0 };
      pointerMoveSelectionAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveSelection', {
        dx: 10,
        dy: 10,
      });
    });

    it('should calculate movement relative to last position after first move', () => {
      pointerMoveSelectionAction.action(mockEvent, mockFlowCore);

      const firstMoveEvent = { ...mockEvent, type: 'pointermove' as const, x: 110, y: 110, button: 0 };
      pointerMoveSelectionAction.action(firstMoveEvent, mockFlowCore);

      const secondMoveEvent = { ...mockEvent, type: 'pointermove' as const, x: 120, y: 120, button: 0 };
      pointerMoveSelectionAction.action(secondMoveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveSelection', {
        dx: 10,
        dy: 10,
      });
    });

    it('should stop movement on pointerup', () => {
      pointerMoveSelectionAction.action(mockEvent, mockFlowCore);

      const firstMoveEvent = { ...mockEvent, type: 'pointermove' as const, x: 110, y: 110, button: 0 };
      pointerMoveSelectionAction.action(firstMoveEvent, mockFlowCore);

      pointerMoveSelectionAction.action({ ...mockEvent, type: 'pointerup', button: 0 }, mockFlowCore);

      const moveAfterUpEvent = { ...mockEvent, type: 'pointermove' as const, x: 120, y: 120, button: 0 };
      pointerMoveSelectionAction.action(moveAfterUpEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledTimes(1);
    });

    it('should not emit movement if not in moving state', () => {
      const moveEvent = { ...mockEvent, type: 'pointermove' as const, x: 110, y: 110 };
      pointerMoveSelectionAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });
  });
});
