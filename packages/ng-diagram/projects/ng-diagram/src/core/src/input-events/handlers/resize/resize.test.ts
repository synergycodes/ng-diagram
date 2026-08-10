import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { macrotask, mockNode } from '../../../test-utils';
import type { Node, ResizeActionState } from '../../../types';
import { ResizeEvent } from './resize.event';
import { ResizeEventHandler } from './resize.handler';

/** Pointer position at gesture start; the factory's default lastInputPoint. */
const START_POINT = { x: 100, y: 100 };
/** Node size at gesture start (see the `nodeWithSize` fixture in beforeEach). */
const INITIAL_SIZE = { width: 200, height: 100 };

function createResizeEvent(overrides: Partial<ResizeEvent> = {}): ResizeEvent {
  return {
    name: 'resize',
    phase: 'start',
    direction: 'bottom-right',
    lastInputPoint: { ...START_POINT },
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
      size: { ...INITIAL_SIZE },
    };

    const mockFlowCore = {
      commandHandler: { emit: mockEmit },
      isCancellingInteraction: () => false,
      clientToFlowPosition: vi.fn(({ x, y }) => ({ x, y })),
      getNodeById: vi.fn().mockReturnValue(nodeWithSize),
      actionStateManager: mockActionStateManager,
      transaction: mockTransaction,
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
        isCancellingInteraction: () => false,
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

  describe('final frame apply on end', () => {
    it('should apply the release point as the final resize before resizeNodeStop', async () => {
      const callOrder: string[] = [];
      mockEmit.mockImplementation((command: string) => {
        callOrder.push(command);
        return Promise.resolve();
      });

      const releaseDelta = { x: 40, y: 30 };
      await handler.handle(createResizeEvent({ phase: 'start' }));
      await handler.handle(
        createResizeEvent({
          phase: 'end',
          direction: 'bottom-right',
          lastInputPoint: { x: START_POINT.x + releaseDelta.x, y: START_POINT.y + releaseDelta.y },
        })
      );

      expect(mockEmit).toHaveBeenCalledWith('resizeNode', {
        id: mockNode.id,
        disableAutoSize: true,
        size: { width: INITIAL_SIZE.width + releaseDelta.x, height: INITIAL_SIZE.height + releaseDelta.y },
      });
      expect(callOrder).toEqual(['resizeNodeStart', 'resizeNode', 'resizeNodeStop']);
    });

    it('should move the position for a release point on a top-left handle', async () => {
      const releaseDelta = { x: 30, y: 20 };
      await handler.handle(createResizeEvent({ phase: 'start' }));
      await handler.handle(
        createResizeEvent({
          phase: 'end',
          direction: 'top-left',
          lastInputPoint: { x: START_POINT.x + releaseDelta.x, y: START_POINT.y + releaseDelta.y },
        })
      );

      expect(mockEmit).toHaveBeenCalledWith('resizeNode', {
        id: mockNode.id,
        disableAutoSize: true,
        size: { width: INITIAL_SIZE.width - releaseDelta.x, height: INITIAL_SIZE.height - releaseDelta.y },
        position: { x: mockNode.position.x + releaseDelta.x, y: mockNode.position.y + releaseDelta.y },
      });
    });

    it('should not emit resizeNode on end when no resize is in progress', async () => {
      await handler.handle(createResizeEvent({ phase: 'end' }));

      expect(mockEmit.mock.calls.some((call) => call[0] === 'resizeNode')).toBe(false);
      expect(mockEmit).toHaveBeenCalledWith('resizeNodeStop', { nodeId: undefined });
    });

    it('should still emit resizeNodeStop and clear the state when the final resize emit rejects', async () => {
      mockEmit.mockImplementation(async (name: string) => {
        if (name === 'resizeNode') {
          throw new Error('middleware failed');
        }
      });

      await handler.handle(createResizeEvent({ phase: 'start' }));
      await expect(
        handler.handle(
          createResizeEvent({ phase: 'end', lastInputPoint: { x: START_POINT.x + 50, y: START_POINT.y + 40 } })
        )
      ).rejects.toThrow('middleware failed');

      expect(mockEmit).toHaveBeenCalledWith('resizeNodeStop', { nodeId: 'node1' });
      expect(mockActionStateManager.clearResize).toHaveBeenCalled();
    });

    it('should not emit resizeNode when the release point equals the gesture start (bare handle click)', async () => {
      await handler.handle(createResizeEvent({ phase: 'start' }));
      await handler.handle(createResizeEvent({ phase: 'end', lastInputPoint: { ...START_POINT } }));

      expect(mockEmit.mock.calls.some((call) => call[0] === 'resizeNode')).toBe(false);
      expect(mockEmit).toHaveBeenCalledWith('resizeNodeStop', { nodeId: 'node1' });
    });

    it('should not emit an extra resizeNode when the release point equals the last continue', async () => {
      const continuePoint = { x: START_POINT.x + 20, y: START_POINT.y + 15 };
      await handler.handle(createResizeEvent({ phase: 'start' }));
      await handler.handle(createResizeEvent({ phase: 'continue', lastInputPoint: continuePoint }));
      mockEmit.mockClear();

      await handler.handle(createResizeEvent({ phase: 'end', lastInputPoint: { ...continuePoint } }));

      expect(mockEmit.mock.calls.some((call) => call[0] === 'resizeNode')).toBe(false);
    });

    it('should apply the release point when it moved past the last continue', async () => {
      const releaseDelta = { x: 28, y: 21 };
      await handler.handle(createResizeEvent({ phase: 'start' }));
      await handler.handle(
        createResizeEvent({ phase: 'continue', lastInputPoint: { x: START_POINT.x + 20, y: START_POINT.y + 15 } })
      );
      mockEmit.mockClear();

      await handler.handle(
        createResizeEvent({
          phase: 'end',
          direction: 'bottom-right',
          lastInputPoint: { x: START_POINT.x + releaseDelta.x, y: START_POINT.y + releaseDelta.y },
        })
      );

      expect(mockEmit).toHaveBeenCalledWith('resizeNode', {
        id: mockNode.id,
        disableAutoSize: true,
        size: { width: INITIAL_SIZE.width + releaseDelta.x, height: INITIAL_SIZE.height + releaseDelta.y },
      });
    });

    it('should not apply another gesture state to a mismatched end target', async () => {
      await handler.handle(createResizeEvent({ phase: 'start' }));

      await handler.handle(
        createResizeEvent({
          phase: 'end',
          target: { ...mockNode, id: 'other-node' },
          lastInputPoint: { x: START_POINT.x + 40, y: START_POINT.y + 30 },
        })
      );

      expect(mockEmit.mock.calls.some((call) => call[0] === 'resizeNode')).toBe(false);
      expect(mockEmit).toHaveBeenCalledWith('resizeNodeStop', { nodeId: 'node1' });
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
      expect(mockEmit).toHaveBeenCalledWith('resizeNodeStop', { nodeId: 'node1' });
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

    it('should refuse to cancel while the normal end phase is in flight', async () => {
      let releaseStop: () => void = () => undefined;
      mockEmit.mockImplementation(async (name: string) => {
        if (name === 'resizeNodeStop') {
          await new Promise<void>((resolve) => {
            releaseStop = resolve;
          });
        }
      });

      await handler.handle(createResizeEvent({ phase: 'start' }));
      const endPromise = handler.handle(createResizeEvent({ phase: 'end' }));

      await expect(handler.cancel()).resolves.toBe(false);

      // The completed gesture is left to its end phase: no rollback, no cancel stamp
      expect(mockActionStateManager.resize?.cancelReason).toBeUndefined();
      expect(mockTransaction).not.toHaveBeenCalledWith('cancelResize', expect.any(Function));

      releaseStop();
      await endPromise;
    });

    it('should not clear a resize that started while the cancel rollback was suspended', async () => {
      mockEmit.mockImplementation(async (name: string) => {
        if (name === 'resizeNodeStop') {
          await macrotask();
        }
      });

      await handler.handle(createResizeEvent({ phase: 'start' }));
      const cancelPromise = handler.cancel();

      // A new resize starts while the cancel rollback is suspended on resizeNodeStop
      await handler.handle(createResizeEvent({ phase: 'start' }));
      const newState = mockActionStateManager.resize;
      expect(newState).toBeDefined();

      await cancelPromise;

      expect(mockActionStateManager.clearResize).not.toHaveBeenCalled();
      expect(mockActionStateManager.resize).toBe(newState);
    });
  });
});
