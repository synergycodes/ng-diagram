import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../../../event-manager/event-manager';
import { mockNode } from '../../../../../test-utils';
import type { DraggingActionState, MiddlewareContext, Node } from '../../../../../types';
import { NodeDragEndedEmitter, NodeDragStartedEmitter } from '../node-drag-lifecycle.emitter';

interface MockActionStateManager {
  dragging: Pick<DraggingActionState, 'nodeIds'> | undefined;
}

function createContext(
  overrides: Partial<Omit<MiddlewareContext, 'actionStateManager'>> & {
    actionStateManager?: MockActionStateManager;
  } = {}
): MiddlewareContext {
  return {
    modelActionTypes: ['moveNodesStart'],
    nodesMap: new Map<string, Node>(),
    initialUpdate: {},
    history: [],
    actionStateManager: {
      dragging: undefined,
    },
    ...overrides,
  } as unknown as MiddlewareContext;
}

describe('NodeDragStartedEmitter', () => {
  let emitter: NodeDragStartedEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;
  let mockActionStateManager: MockActionStateManager;

  beforeEach(() => {
    emitter = new NodeDragStartedEmitter();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: emitSpy,
    } as unknown as EventManager;

    mockActionStateManager = {
      dragging: { nodeIds: ['node1'] },
    };

    const node: Node = { ...mockNode, id: 'node1' };
    context = createContext({
      modelActionTypes: ['moveNodesStart'],
      nodesMap: new Map([['node1', node]]),
      actionStateManager: mockActionStateManager,
    });
  });

  describe('action type filtering', () => {
    it('should not emit when action type is not moveNodesStart', () => {
      context.modelActionTypes = ['moveNodesBy'];

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit for moveNodesStart action', () => {
      emitter.emit(context, eventManager);

      const node = context.nodesMap.get('node1')!;
      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeDragStarted', { nodes: [node] });
    });
  });

  describe('node resolution from actionState', () => {
    it('should resolve nodes from nodeIds in actionState', () => {
      const node1: Node = { ...mockNode, id: 'node1' };
      const node2: Node = { ...mockNode, id: 'node2' };
      context.nodesMap = new Map([
        ['node1', node1],
        ['node2', node2],
      ]);
      mockActionStateManager.dragging = { nodeIds: ['node1', 'node2'] };

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledWith('nodeDragStarted', { nodes: [node1, node2] });
    });

    it('should not emit when dragging state is undefined', () => {
      mockActionStateManager.dragging = undefined;

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit when nodeIds is empty', () => {
      mockActionStateManager.dragging = { nodeIds: [] };

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should skip nodeIds that do not exist in nodesMap', () => {
      const node1: Node = { ...mockNode, id: 'node1' };
      context.nodesMap = new Map([['node1', node1]]);
      mockActionStateManager.dragging = { nodeIds: ['node1', 'nonexistent'] };

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledWith('nodeDragStarted', { nodes: [node1] });
    });

    it('should not emit when all nodeIds are missing from nodesMap', () => {
      context.nodesMap = new Map();
      mockActionStateManager.dragging = { nodeIds: ['nonexistent'] };

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});

describe('NodeDragEndedEmitter', () => {
  let emitter: NodeDragEndedEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;
  let mockActionStateManager: MockActionStateManager;

  beforeEach(() => {
    emitter = new NodeDragEndedEmitter();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: emitSpy,
    } as unknown as EventManager;

    mockActionStateManager = {
      dragging: { nodeIds: ['node1'] },
    };

    const node: Node = { ...mockNode, id: 'node1' };
    context = createContext({
      modelActionTypes: ['moveNodesStop'],
      nodesMap: new Map([['node1', node]]),
      actionStateManager: mockActionStateManager,
    });
  });

  describe('action type filtering', () => {
    it('should not emit when action type is not moveNodesStop', () => {
      context.modelActionTypes = ['moveNodesBy'];

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit for moveNodesStop action', () => {
      emitter.emit(context, eventManager);

      const node = context.nodesMap.get('node1')!;
      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeDragEnded', { nodes: [node] });
    });
  });

  describe('node resolution from actionState', () => {
    it('should resolve nodes from nodeIds in actionState', () => {
      const node1: Node = { ...mockNode, id: 'node1' };
      const node2: Node = { ...mockNode, id: 'node2' };
      context.nodesMap = new Map([
        ['node1', node1],
        ['node2', node2],
      ]);
      mockActionStateManager.dragging = { nodeIds: ['node1', 'node2'] };

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledWith('nodeDragEnded', { nodes: [node1, node2] });
    });

    it('should not emit when dragging state is undefined', () => {
      mockActionStateManager.dragging = undefined;

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit when nodeIds is empty', () => {
      mockActionStateManager.dragging = { nodeIds: [] };

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should skip nodeIds that do not exist in nodesMap', () => {
      const node1: Node = { ...mockNode, id: 'node1' };
      context.nodesMap = new Map([['node1', node1]]);
      mockActionStateManager.dragging = { nodeIds: ['node1', 'nonexistent'] };

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledWith('nodeDragEnded', { nodes: [node1] });
    });

    it('should not emit when all nodeIds are missing from nodesMap', () => {
      context.nodesMap = new Map();
      mockActionStateManager.dragging = { nodeIds: ['nonexistent'] };

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});
