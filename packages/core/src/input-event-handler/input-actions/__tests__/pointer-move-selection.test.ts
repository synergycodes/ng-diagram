import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { getSamplePointerEvent, mockEdge, mockEnvironment, mockNode } from '../../../test-utils';
import type { EventTarget, PointerEvent } from '../../../types';
import { pointerMoveSelectionAction } from '../pointer-move-selection';

// Import the moveState directly from the module
import * as pointerMoveSelectionModule from '../pointer-move-selection';

interface MoveState {
  lastX: number;
  lastY: number;
  isMoving: boolean;
}

describe('pointerMoveSelectionAction', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockEvent: PointerEvent;
  let mockTarget: EventTarget;
  let mockFlowCore: FlowCore;
  let mockModelLookup: {
    getSelectedNodes: ReturnType<typeof vi.fn>;
    isNodeDescendantOfGroup: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTarget = { type: 'node', element: mockNode };
    mockEvent = getSamplePointerEvent({ type: 'pointerdown', x: 100, y: 100, target: mockTarget });

    mockModelLookup = {
      getSelectedNodes: vi.fn().mockReturnValue([mockNode]),
      isNodeDescendantOfGroup: vi.fn().mockReturnValue(false),
    };

    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
      clientToFlowPosition: vi.fn(({ x, y }) => ({ x, y })),
      modelLookup: mockModelLookup,
      getNodesInRange: vi.fn().mockReturnValue([]),
    } as unknown as FlowCore;

    // Reset the moveState
    const moveState = (pointerMoveSelectionModule as unknown as { moveState: MoveState }).moveState;
    if (moveState) {
      moveState.lastX = 0;
      moveState.lastY = 0;
      moveState.isMoving = false;
    }
  });

  describe('predicate', () => {
    it('should return true for pointerdown events', () => {
      expect(
        pointerMoveSelectionAction.predicate(
          getSamplePointerEvent({ type: 'pointerdown', button: 0, target: mockTarget }),
          mockFlowCore
        )
      ).toBe(true);
    });

    it('should return false for pointer move event if moving is not started', () => {
      expect(
        pointerMoveSelectionAction.predicate(
          getSamplePointerEvent({ type: 'pointermove', target: mockTarget }),
          mockFlowCore
        )
      ).toBe(false);
    });

    it('should return true for pointermove events if move started', () => {
      pointerMoveSelectionAction.action(mockEvent, mockFlowCore);
      expect(
        pointerMoveSelectionAction.predicate(
          getSamplePointerEvent({ type: 'pointermove', target: mockTarget }),
          mockFlowCore
        )
      ).toBe(true);
    });

    it('should return true for pointerup events', () => {
      expect(
        pointerMoveSelectionAction.predicate(getSamplePointerEvent({ type: 'pointerup', button: 0 }), mockFlowCore)
      ).toBe(true);
    });

    it('should return false for other events', () => {
      expect(pointerMoveSelectionAction.predicate(getSamplePointerEvent({ type: 'pointerenter' }), mockFlowCore)).toBe(
        false
      );
      expect(pointerMoveSelectionAction.predicate(getSamplePointerEvent({ type: 'pointerleave' }), mockFlowCore)).toBe(
        false
      );
    });

    it('should return false for pointerdown events with a non-node target', () => {
      expect(
        pointerMoveSelectionAction.predicate(
          getSamplePointerEvent({ type: 'pointerdown', target: { type: 'edge', element: mockEdge }, button: 0 }),
          mockFlowCore
        )
      ).toBe(false);
    });

    it('should return false for pointerdown events with wrong button', () => {
      expect(
        pointerMoveSelectionAction.predicate(
          getSamplePointerEvent({ type: 'pointerdown', button: 1, target: mockTarget }),
          mockFlowCore
        )
      ).toBe(false);
    });
  });

  describe('action', () => {
    it('should initialize state on pointerdown', () => {
      pointerMoveSelectionAction.action(mockEvent, mockFlowCore);

      const moveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110, target: mockTarget });
      pointerMoveSelectionAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveSelection', { dx: 10, dy: 10 });
    });

    it('should calculate movement relative to last position after first move', () => {
      pointerMoveSelectionAction.action(mockEvent, mockFlowCore);

      const firstMoveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110 });
      pointerMoveSelectionAction.action(firstMoveEvent, mockFlowCore);

      const secondMoveEvent = getSamplePointerEvent({ type: 'pointermove', x: 120, y: 120 });
      pointerMoveSelectionAction.action(secondMoveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveSelection', { dx: 10, dy: 10 });
    });

    it('should stop movement on pointerup', () => {
      pointerMoveSelectionAction.action(mockEvent, mockFlowCore);

      const firstMoveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110 });
      pointerMoveSelectionAction.action(firstMoveEvent, mockFlowCore);

      pointerMoveSelectionAction.action(getSamplePointerEvent({ type: 'pointerup', button: 0 }), mockFlowCore);

      const moveAfterUpEvent = getSamplePointerEvent({ type: 'pointermove', x: 120, y: 120 });
      pointerMoveSelectionAction.action(moveAfterUpEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenNthCalledWith(1, 'moveSelection', { dx: 10, dy: 10 });
      expect(mockCommandHandler.emit).not.toHaveBeenNthCalledWith(2, 'moveSelection', { dx: 10, dy: 10 });
    });

    it('should not emit movement if not in moving state', () => {
      const moveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110 });
      pointerMoveSelectionAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });
  });
});
