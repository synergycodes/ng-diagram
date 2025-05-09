import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment, mockNode } from '../../../test-utils';
import type { EventTarget, PointerEvent } from '../../../types';
import { panningAction } from '../panning';

describe('panningAction', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockEvent: PointerEvent;
  let mockTarget: EventTarget;
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTarget = { type: 'diagram' } as EventTarget;

    mockEvent = {
      type: 'pointerdown',
      timestamp: Date.now(),
      target: mockTarget,
      x: 100,
      y: 100,
      pressure: 1,
      button: 0,
    } as PointerEvent;

    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
    } as unknown as FlowCore;

    panningAction.action({ ...mockEvent, type: 'pointerup' as const, button: 0 }, mockFlowCore);
  });

  describe('predicate', () => {
    it('should return true for pointerdown events', () => {
      expect(panningAction.predicate(mockEvent, mockFlowCore)).toBe(true);
    });

    it('should return true for pointermove events', () => {
      expect(panningAction.predicate({ ...mockEvent, type: 'pointermove' }, mockFlowCore)).toBe(true);
    });

    it('should return true for pointerup events', () => {
      expect(panningAction.predicate({ ...mockEvent, type: 'pointerup', button: 0 }, mockFlowCore)).toBe(true);
    });

    it('should return false for other events', () => {
      expect(panningAction.predicate({ ...mockEvent, type: 'pointerenter' }, mockFlowCore)).toBe(false);
      expect(panningAction.predicate({ ...mockEvent, type: 'pointerleave' }, mockFlowCore)).toBe(false);
    });

    it('should return false for pointerdown events with a non-background target', () => {
      expect(
        panningAction.predicate(
          { ...mockEvent, type: 'pointerdown', target: { type: 'node', element: mockNode }, button: 0 },
          mockFlowCore
        )
      ).toBe(false);
    });
  });

  describe('action', () => {
    it('should initialize state on pointerdown', () => {
      panningAction.action(mockEvent, mockFlowCore);

      const moveEvent = { ...mockEvent, type: 'pointermove' as const, x: 110, y: 110 };
      panningAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', {
        x: 10,
        y: 10,
      });
    });

    it('should calculate movement relative to last position after first move', () => {
      panningAction.action(mockEvent, mockFlowCore);

      const firstMoveEvent = { ...mockEvent, type: 'pointermove' as const, x: 110, y: 110 };
      panningAction.action(firstMoveEvent, mockFlowCore);

      const secondMoveEvent = { ...mockEvent, type: 'pointermove' as const, x: 120, y: 120 };
      panningAction.action(secondMoveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', {
        x: 10,
        y: 10,
      });
    });

    it('should stop movement on pointerup', () => {
      panningAction.action(mockEvent, mockFlowCore);

      const firstMoveEvent = { ...mockEvent, type: 'pointermove' as const, x: 110, y: 110 };
      panningAction.action(firstMoveEvent, mockFlowCore);

      panningAction.action({ ...mockEvent, type: 'pointerup' as const, button: 0 }, mockFlowCore);

      const moveAfterUpEvent = { ...mockEvent, type: 'pointermove' as const, x: 120, y: 120 };
      panningAction.action(moveAfterUpEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledTimes(1);
    });

    it('should not emit movement if not in moving state', () => {
      const moveEvent = { ...mockEvent, type: 'pointermove' as const, x: 110, y: 110 };
      panningAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });
  });
});
