import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../../../event-manager/event-manager';
import { mockNode } from '../../../../../test-utils';
import type { MiddlewareContext, Node, ResizeActionState } from '../../../../../types';
import { NodeResizeEndedEmitter, NodeResizeStartedEmitter } from '../node-resize-lifecycle.emitter';

interface MockActionStateManager {
  resize: Pick<ResizeActionState, 'resizingNode'> | undefined;
}

function createContext(
  overrides: Partial<Omit<MiddlewareContext, 'actionStateManager'>> & {
    actionStateManager?: MockActionStateManager;
  } = {}
): MiddlewareContext {
  return {
    modelActionTypes: ['resizeNodeStart'],
    nodesMap: new Map<string, Node>(),
    initialUpdate: {},
    history: [],
    actionStateManager: {
      resize: undefined,
    },
    ...overrides,
  } as unknown as MiddlewareContext;
}

describe('NodeResizeStartedEmitter', () => {
  let emitter: NodeResizeStartedEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;
  let mockActionStateManager: MockActionStateManager;

  beforeEach(() => {
    emitter = new NodeResizeStartedEmitter();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: emitSpy,
    } as unknown as EventManager;

    const node: Node = { ...mockNode, id: 'node1' };

    mockActionStateManager = {
      resize: { resizingNode: node },
    };

    context = createContext({
      modelActionTypes: ['resizeNodeStart'],
      nodesMap: new Map([['node1', node]]),
      actionStateManager: mockActionStateManager,
    });
  });

  describe('action type filtering', () => {
    it('should not emit when action type is not resizeNodeStart', () => {
      context.modelActionTypes = ['resizeNode'];

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit for resizeNodeStart action', () => {
      emitter.emit(context, eventManager);

      const node = context.nodesMap.get('node1')!;
      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeResizeStarted', { node });
    });
  });

  describe('node resolution from actionState', () => {
    it('should resolve node from resizingNode in actionState', () => {
      const node: Node = { ...mockNode, id: 'node1' };
      context.nodesMap = new Map([['node1', node]]);
      mockActionStateManager.resize = { resizingNode: node };

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledWith('nodeResizeStarted', { node });
    });

    it('should not emit when resize state is undefined', () => {
      mockActionStateManager.resize = undefined;

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit when resizingNode does not exist in nodesMap', () => {
      const node: Node = { ...mockNode, id: 'nonexistent' };
      mockActionStateManager.resize = { resizingNode: node };
      context.nodesMap = new Map();

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});

describe('NodeResizeEndedEmitter', () => {
  let emitter: NodeResizeEndedEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;
  let mockActionStateManager: MockActionStateManager;

  beforeEach(() => {
    emitter = new NodeResizeEndedEmitter();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: emitSpy,
    } as unknown as EventManager;

    const node: Node = { ...mockNode, id: 'node1' };

    mockActionStateManager = {
      resize: { resizingNode: node },
    };

    context = createContext({
      modelActionTypes: ['resizeNodeStop'],
      nodesMap: new Map([['node1', node]]),
      actionStateManager: mockActionStateManager,
    });
  });

  describe('action type filtering', () => {
    it('should not emit when action type is not resizeNodeStop', () => {
      context.modelActionTypes = ['resizeNode'];

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit for resizeNodeStop action', () => {
      emitter.emit(context, eventManager);

      const node = context.nodesMap.get('node1')!;
      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeResizeEnded', { node });
    });
  });

  describe('node resolution from actionState', () => {
    it('should resolve node from resizingNode in actionState', () => {
      const node: Node = { ...mockNode, id: 'node1' };
      context.nodesMap = new Map([['node1', node]]);
      mockActionStateManager.resize = { resizingNode: node };

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledWith('nodeResizeEnded', { node });
    });

    it('should not emit when resize state is undefined', () => {
      mockActionStateManager.resize = undefined;

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit when resizingNode does not exist in nodesMap', () => {
      const node: Node = { ...mockNode, id: 'nonexistent' };
      mockActionStateManager.resize = { resizingNode: node };
      context.nodesMap = new Map();

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});
