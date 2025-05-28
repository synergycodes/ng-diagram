import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { ResizeEvent } from '../../../types';
import { handleResizeEvent } from './handle-resize-event';

describe('handleResizeEvent', () => {
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    mockFlowCore = { commandHandler: { emit: vi.fn() } } as unknown as FlowCore;
  });

  describe('when target is not a node', () => {
    it('should not emit resizeNode command', () => {
      const mockEvent: ResizeEvent = {
        type: 'resize',
        timestamp: Date.now(),
        target: { type: 'diagram' },
        width: 100,
        height: 200,
      };

      handleResizeEvent(mockFlowCore, mockEvent);

      expect(mockFlowCore.commandHandler.emit).not.toHaveBeenCalled();
    });
  });

  describe('when target is a node', () => {
    it('should not emit resizeNode command when autoSize is false', () => {
      const mockEvent: ResizeEvent = {
        type: 'resize',
        timestamp: Date.now(),
        target: {
          type: 'node',
          element: {
            id: 'node1',
            type: 'node',
            autoSize: false,
            position: { x: 0, y: 0 },
            data: {},
          },
        },
        width: 100,
        height: 200,
      };

      handleResizeEvent(mockFlowCore, mockEvent);

      expect(mockFlowCore.commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should emit resizeNode command when target is node and autoSize is true', () => {
      const mockEvent: ResizeEvent = {
        type: 'resize',
        timestamp: Date.now(),
        target: {
          type: 'node',
          element: {
            id: 'node1',
            type: 'node',
            autoSize: true,
            position: { x: 0, y: 0 },
            data: {},
          },
        },
        width: 100,
        height: 200,
      };

      handleResizeEvent(mockFlowCore, mockEvent);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('resizeNode', {
        id: 'node1',
        size: { width: 100, height: 200 },
      });
    });
  });
});
