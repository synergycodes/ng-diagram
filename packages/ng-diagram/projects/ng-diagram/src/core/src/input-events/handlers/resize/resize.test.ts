import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockNode } from '../../../test-utils';
import type { Node, ResizeActionState } from '../../../types';
import { ResizeEvent } from './resize.event';
import { ResizeEventHandler } from './resize.handler';

function createResizeEvent(overrides: Partial<ResizeEvent> = {}): ResizeEvent {
  return {
    name: 'resize',
    phase: 'start',
    direction: 'bottom-right',
    lastInputPoint: { x: 100, y: 100 },
    target: mockNode,
    targetType: 'node',
    id: 'test-id',
    timestamp: Date.now(),
    modifiers: {
      primary: false,
      secondary: false,
      shift: false,
      meta: false,
    },
    ...overrides,
  };
}

describe('ResizeEventHandler', () => {
  let handler: ResizeEventHandler;
  let mockEmit: ReturnType<typeof vi.fn>;
  let mockActionStateManager: {
    resize: ResizeActionState | undefined;
    clearResize: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockEmit = vi.fn();

    mockActionStateManager = {
      resize: undefined,
      clearResize: vi.fn(),
    };

    const nodeWithSize: Node = {
      ...mockNode,
      id: 'node1',
      size: { width: 200, height: 100 },
    };

    const mockFlowCore = {
      commandHandler: { emit: mockEmit },
      clientToFlowPosition: vi.fn(({ x, y }) => ({ x, y })),
      getNodeById: vi.fn().mockReturnValue(nodeWithSize),
      actionStateManager: mockActionStateManager,
    } as unknown as FlowCore;

    handler = new ResizeEventHandler(mockFlowCore);
  });

  describe('resizeNodeStart command', () => {
    it('should emit resizeNodeStart command on phase start when node has size', async () => {
      const event = createResizeEvent({
        phase: 'start',
        target: { ...mockNode, id: 'node1', size: { width: 200, height: 100 } },
      });

      await handler.handle(event);

      expect(mockEmit).toHaveBeenCalledWith('resizeNodeStart');
    });

    it('should NOT emit resizeNodeStart when node has no size', async () => {
      const nodeWithoutSize: Node = { ...mockNode, id: 'node2' };

      const mockFlowCore = {
        commandHandler: { emit: mockEmit },
        clientToFlowPosition: vi.fn(({ x, y }) => ({ x, y })),
        getNodeById: vi.fn().mockReturnValue(nodeWithoutSize),
        actionStateManager: mockActionStateManager,
      } as unknown as FlowCore;

      handler = new ResizeEventHandler(mockFlowCore);

      const event = createResizeEvent({
        phase: 'start',
        target: nodeWithoutSize,
      });

      await handler.handle(event);

      expect(mockEmit).not.toHaveBeenCalledWith('resizeNodeStart');
    });
  });

  describe('resizeNodeStop command', () => {
    it('should emit resizeNodeStop command on phase end', async () => {
      const event = createResizeEvent({
        phase: 'end',
      });

      await handler.handle(event);

      expect(mockEmit).toHaveBeenCalledWith('resizeNodeStop');
    });

    it('should emit resizeNodeStop before clearResize is called', async () => {
      const callOrder: string[] = [];
      mockEmit.mockImplementation((command: string) => {
        callOrder.push(command);
        return Promise.resolve();
      });
      mockActionStateManager.clearResize.mockImplementation(() => {
        callOrder.push('clearResize');
      });

      const event = createResizeEvent({
        phase: 'end',
      });

      await handler.handle(event);

      expect(callOrder).toEqual(['resizeNodeStop', 'clearResize']);
    });
  });
});
