import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../../flow-core';
import { getSamplePointerEvent, getSampleRotateEvent, mockNode } from '../../../../test-utils';
import type { RotateEvent, RotateHandleTarget } from '../../../../types';
import { getDistanceBetweenPoints } from '../../../../utils';
import { getRotationAngle } from '../get-rotation-angle';
import { rotateAction } from '../rotate';

vi.mock('../get-rotation-angle');
vi.mock('../../../../utils/get-distance-between-points');

describe('rotateAction', () => {
  let flowCore: FlowCore;
  let mockCommandHandler: { emit: ReturnType<typeof vi.fn> };

  const node = { ...mockNode, id: 'test-node' };
  const rotateHandleTarget: RotateHandleTarget = {
    type: 'rotate-handle',
    element: node,
  };
  const baseEvent: RotateEvent = {
    type: 'rotate',
    timestamp: 1,
    target: rotateHandleTarget,
    mouse: { x: 100, y: 100 },
    handle: { x: 120, y: 120 },
    center: { x: 110, y: 110 },
  };

  beforeEach(() => {
    mockCommandHandler = { emit: vi.fn() };
    flowCore = { commandHandler: mockCommandHandler } as unknown as FlowCore;
    vi.clearAllMocks();
  });

  describe('predicate', () => {
    it('should return true for rotate event with rotate handle target', () => {
      expect(rotateAction.predicate(baseEvent, flowCore)).toBe(true);
    });

    it('should return false for non-rotate event', () => {
      expect(rotateAction.predicate(getSamplePointerEvent(), flowCore)).toBe(false);
    });

    it('should return false for non-rotate handle target', () => {
      expect(
        rotateAction.predicate(
          getSampleRotateEvent({
            target: { type: 'node', element: node },
          }),
          flowCore
        )
      ).toBe(false);
    });
  });

  describe('action', () => {
    it('should not emit if mouse is too close to center', () => {
      (getDistanceBetweenPoints as unknown as ReturnType<typeof vi.fn>).mockReturnValue(10);
      rotateAction.action(baseEvent, flowCore);
      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });

    it('should emit rotateNodeBy with correct params if distance is sufficient', () => {
      vi.mocked(getDistanceBetweenPoints).mockReturnValue(50);
      vi.mocked(getRotationAngle).mockReturnValue(42);
      rotateAction.action(baseEvent, flowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('rotateNodeBy', {
        nodeId: 'test-node',
        angle: 42,
      });
    });
  });
});
