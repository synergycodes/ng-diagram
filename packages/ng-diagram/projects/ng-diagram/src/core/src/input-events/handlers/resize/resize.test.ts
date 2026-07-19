import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { macrotask, mockNode } from '../../../test-utils';
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

  describe('re-entrancy under async command emits', () => {
    it('should not clear a newly started resize while the previous stop emit is suspended', async () => {
      mockEmit.mockImplementation(async (name: string) => {
        if (name === 'resizeNodeStop') {
          await macrotask();
        }
      });

      await handler.handle(createResizeEvent({ phase: 'start' }));
      const endPromise = handler.handle(createResizeEvent({ phase: 'end' }));

      // A new resize starts while the previous end is suspended on resizeNodeStop
      await handler.handle(createResizeEvent({ phase: 'start' }));
      const newState = mockActionStateManager.resize;
      expect(newState).toBeDefined();

      await endPromise;

      expect(mockActionStateManager.clearResize).not.toHaveBeenCalled();
      expect(mockActionStateManager.resize).toBe(newState);
    });

    it('should clear the resize state even when the stop emit rejects', async () => {
      mockEmit.mockImplementation(async (name: string) => {
        if (name === 'resizeNodeStop') {
          throw new Error('middleware failed');
        }
      });

      await handler.handle(createResizeEvent({ phase: 'start' }));
      await expect(handler.handle(createResizeEvent({ phase: 'end' }))).rejects.toThrow('middleware failed');

      expect(mockActionStateManager.clearResize).toHaveBeenCalled();
    });

    it('should clear the resize state when no new gesture started during the stop emit', async () => {
      mockEmit.mockImplementation(async (name: string) => {
        if (name === 'resizeNodeStop') {
          await macrotask();
        }
      });

      await handler.handle(createResizeEvent({ phase: 'start' }));
      await handler.handle(createResizeEvent({ phase: 'end' }));

      expect(mockActionStateManager.clearResize).toHaveBeenCalled();
    });
  });

  describe('resizeNodeStart command', () => {
    it('should emit resizeNodeStart command on phase start when node has size', async () => {
      const event = createResizeEvent({
        phase: 'start',
        target: { ...mockNode, id: 'node1', size: { width: 200, height: 100 } },
      });

      await handler.handle(event);

      expect(mockEmit).toHaveBeenCalledWith('resizeNodeStart', { nodeId: expect.any(String) });
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

      expect(mockEmit.mock.calls.some((call) => call[0] === 'resizeNodeStart')).toBe(false);
    });
  });

  describe('resizeNodeStop command', () => {
    it('should emit resizeNodeStop command on phase end', async () => {
      const event = createResizeEvent({
        phase: 'end',
      });

      await handler.handle(event);

      expect(mockEmit).toHaveBeenCalledWith('resizeNodeStop', { nodeId: undefined });
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
