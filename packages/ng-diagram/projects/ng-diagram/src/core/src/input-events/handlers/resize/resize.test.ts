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
  let mockTransaction: ReturnType<typeof vi.fn>;
  let mockActionStateManager: {
    resize: ResizeActionState | undefined;
    clearResize: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockEmit = vi.fn();
    mockTransaction = vi.fn().mockImplementation(async (_name, callback) => {
      const txContext = { emit: mockEmit };
      return await callback(txContext);
    });

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
      transaction: mockTransaction,
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

  describe('cancel', () => {
    it('should do nothing when no resize is in progress', async () => {
      await handler.cancel();

      expect(mockEmit).not.toHaveBeenCalled();
      expect(mockActionStateManager.clearResize).not.toHaveBeenCalled();
    });

    it('should set the cancelled reason, emit resizeNodeStop and clear the state', async () => {
      await handler.handle(createResizeEvent({ phase: 'start' }));
      const resizeState = mockActionStateManager.resize;

      await handler.cancel();

      expect(resizeState?.cancelReason).toBe('cancelled');
      expect(mockEmit).toHaveBeenCalledWith('resizeNodeStop');
      expect(mockActionStateManager.clearResize).toHaveBeenCalled();
    });

    it('should restore the pre-resize size, position and autoSize', async () => {
      await handler.handle(createResizeEvent({ phase: 'start' }));
      await handler.handle(
        createResizeEvent({ phase: 'continue', direction: 'bottom-right', lastInputPoint: { x: 150, y: 140 } })
      );

      await handler.cancel();

      expect(mockEmit).toHaveBeenCalledWith('updateNode', {
        id: 'node1',
        nodeChanges: {
          size: { width: 200, height: 100 },
          position: mockNode.position,
          autoSize: undefined,
        },
      });
      const calls = mockEmit.mock.calls.map(([name]) => name);
      expect(calls.indexOf('updateNode')).toBeLessThan(calls.indexOf('resizeNodeStop'));
    });

    it('should roll back inside a cancelResize transaction', async () => {
      await handler.handle(createResizeEvent({ phase: 'start' }));

      await handler.cancel();

      expect(mockTransaction).toHaveBeenCalledWith('cancelResize', expect.any(Function));
    });
  });
});
