import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEdge, mockEnvironment, mockNode, mockPointerEvent } from '../../../test-utils';
import type { Event, EventTarget } from '../../../types';
import { resizeAction } from '../resize';

describe('resizeAction', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockEvent: Event;
  let mockTarget: EventTarget;
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTarget = { type: 'node', element: { ...mockNode, autoSize: true } };

    mockEvent = {
      type: 'resize',
      target: mockTarget,
      width: 100,
      height: 100,
      timestamp: Date.now(),
    };

    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
    } as unknown as FlowCore;
  });

  describe('predicate', () => {
    it('should return true for resize event and if target is node', () => {
      expect(resizeAction.predicate(mockEvent, mockFlowCore)).toBe(true);
    });

    it('should return false for pointermove events', () => {
      expect(resizeAction.predicate({ ...mockPointerEvent, type: 'pointermove' }, mockFlowCore)).toBe(false);
    });

    it('should return false for resize events with wrong target', () => {
      expect(resizeAction.predicate({ ...mockEvent, target: { type: 'edge', element: mockEdge } }, mockFlowCore)).toBe(
        false
      );
    });
  });

  describe('action', () => {
    it('should emit resizeNode if target is node and autoSize is true', () => {
      mockEvent.target = {
        type: 'node',
        element: { ...mockNode, size: { width: 100, height: 100 }, autoSize: true },
      };

      resizeAction.action(mockEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('resizeNode', {
        id: mockNode.id,
        size: { width: 100, height: 100 },
      });
    });

    it('should emit resizeNode if target is node and autoSize is not defined', () => {
      mockEvent.target = {
        type: 'node',
        element: { ...mockNode, size: { width: 100, height: 100 } },
      };

      resizeAction.action(mockEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('resizeNode', {
        id: mockNode.id,
        size: { width: 100, height: 100 },
      });
    });

    it('should not emit resizeNode if target is node and autoSize is false', () => {
      mockEvent.target = {
        type: 'node',
        element: { ...mockNode, size: { width: 100, height: 100 }, autoSize: false },
      };

      resizeAction.action(mockEvent, mockFlowCore);

      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });
  });
});
