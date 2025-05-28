import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { getSampleKeyboardEvent, getSamplePointerEvent } from '../../../test-utils';
import { Node, ResizeEvent } from '../../../types';
import { handlePointerEvent } from './handle-pointer-event';
import { handleResizeEvent } from './handle-resize-event';
import { resizeAction } from './resize';

vi.mock('./handle-pointer-event', () => ({
  handlePointerEvent: vi.fn(),
}));

vi.mock('./handle-resize-event', () => ({
  handleResizeEvent: vi.fn(),
}));

describe('Resize actions', () => {
  let flowCore: FlowCore;
  const mockNode: Node = {
    id: 'test-node',
    type: 'node',
    position: { x: 100, y: 100 },
    size: { width: 200, height: 200 },
    data: {},
  };

  beforeEach(() => {
    flowCore = {} as unknown as FlowCore;
    vi.clearAllMocks();
  });

  describe('predicate', () => {
    it('should return true for resize event with node target', () => {
      const event: ResizeEvent = {
        type: 'resize',
        timestamp: 0,
        target: { type: 'node', element: mockNode },
        width: 300,
        height: 300,
      };

      expect(resizeAction.predicate(event, flowCore)).toBe(true);
    });

    it('should return true for pointer down event with resize handle target and button 0 (left mouse button)', () => {
      const event = getSamplePointerEvent({
        type: 'pointerdown',
        button: 0,
        target: { type: 'resize-handle', element: mockNode, position: 'top-left' },
      });

      expect(resizeAction.predicate(event, flowCore)).toBe(true);
    });

    it('should return true for pointer move event', () => {
      const event = getSamplePointerEvent({ type: 'pointermove' });

      expect(resizeAction.predicate(event, flowCore)).toBe(true);
    });

    it('should return true for pointer up event with button 0 (left mouse button)', () => {
      const event = getSamplePointerEvent({ type: 'pointerup', button: 0 });

      expect(resizeAction.predicate(event, flowCore)).toBe(true);
    });

    it('should return false for keyboard event', () => {
      const event = getSampleKeyboardEvent({ type: 'keydown' });

      expect(resizeAction.predicate(event, flowCore)).toBe(false);
    });
  });

  describe('action', () => {
    it('should call handlePointerEvent for pointer event', () => {
      const event = getSamplePointerEvent({ type: 'pointermove' });

      resizeAction.action(event, flowCore);

      expect(handlePointerEvent).toHaveBeenCalledWith(flowCore, event);
    });

    it('should call handleResizeEvent for resize event', () => {
      const resizeEvent: ResizeEvent = {
        type: 'resize',
        target: { element: mockNode, type: 'node' },
        width: 300,
        height: 300,
        timestamp: 0,
      };

      resizeAction.action(resizeEvent, flowCore);

      expect(handleResizeEvent).toHaveBeenCalledWith(flowCore, resizeEvent);
    });

    it('should not call handlePointerEvent or handleResizeEvent for keyboard event', () => {
      const event = getSampleKeyboardEvent({ type: 'keydown' });

      resizeAction.action(event, flowCore);

      expect(handlePointerEvent).not.toHaveBeenCalled();
      expect(handleResizeEvent).not.toHaveBeenCalled();
    });
  });
});
