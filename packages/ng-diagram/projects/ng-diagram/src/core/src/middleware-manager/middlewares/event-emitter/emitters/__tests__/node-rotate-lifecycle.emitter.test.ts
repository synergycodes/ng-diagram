import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../../../event-manager/event-manager';
import { mockNode } from '../../../../../test-utils';
import type { MiddlewareContext, Node, RotationActionState } from '../../../../../types';
import { NodeRotateEndedEmitter, NodeRotateStartedEmitter } from '../node-rotate-lifecycle.emitter';

interface MockActionStateManager {
  rotation: Pick<RotationActionState, 'nodeId'> | undefined;
}

function createContext(
  overrides: Partial<Omit<MiddlewareContext, 'actionStateManager'>> & {
    actionStateManager?: MockActionStateManager;
  } = {}
): MiddlewareContext {
  return {
    modelActionTypes: ['rotateNodeStart'],
    nodesMap: new Map<string, Node>(),
    initialUpdate: {},
    history: [],
    actionStateManager: {
      rotation: undefined,
    },
    ...overrides,
  } as unknown as MiddlewareContext;
}

describe('NodeRotateStartedEmitter', () => {
  let emitter: NodeRotateStartedEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;
  let mockActionStateManager: MockActionStateManager;

  beforeEach(() => {
    emitter = new NodeRotateStartedEmitter();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: emitSpy,
    } as unknown as EventManager;

    const node: Node = { ...mockNode, id: 'node1' };

    mockActionStateManager = {
      rotation: { nodeId: 'node1' },
    };

    context = createContext({
      modelActionTypes: ['rotateNodeStart'],
      nodesMap: new Map([['node1', node]]),
      actionStateManager: mockActionStateManager,
    });
  });

  describe('action type filtering', () => {
    it('should not emit when action type is not rotateNodeStart', () => {
      context.modelActionTypes = ['rotateNodeTo'];

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit for rotateNodeStart action', () => {
      emitter.emit(context, eventManager);

      const node = context.nodesMap.get('node1')!;
      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeRotateStarted', { node });
    });
  });

  describe('node resolution from actionState', () => {
    it('should resolve node from nodeId in actionState', () => {
      const node: Node = { ...mockNode, id: 'node1' };
      context.nodesMap = new Map([['node1', node]]);
      mockActionStateManager.rotation = { nodeId: 'node1' };

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledWith('nodeRotateStarted', { node });
    });

    it('should not emit when rotation state is undefined', () => {
      mockActionStateManager.rotation = undefined;

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit when nodeId does not exist in nodesMap', () => {
      mockActionStateManager.rotation = { nodeId: 'nonexistent' };
      context.nodesMap = new Map();

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});

describe('NodeRotateEndedEmitter', () => {
  let emitter: NodeRotateEndedEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;
  let mockActionStateManager: MockActionStateManager;

  beforeEach(() => {
    emitter = new NodeRotateEndedEmitter();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: emitSpy,
    } as unknown as EventManager;

    const node: Node = { ...mockNode, id: 'node1' };

    mockActionStateManager = {
      rotation: { nodeId: 'node1' },
    };

    context = createContext({
      modelActionTypes: ['rotateNodeStop'],
      nodesMap: new Map([['node1', node]]),
      actionStateManager: mockActionStateManager,
    });
  });

  describe('action type filtering', () => {
    it('should not emit when action type is not rotateNodeStop', () => {
      context.modelActionTypes = ['rotateNodeTo'];

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit for rotateNodeStop action', () => {
      emitter.emit(context, eventManager);

      const node = context.nodesMap.get('node1')!;
      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeRotateEnded', { node });
    });
  });

  describe('node resolution from actionState', () => {
    it('should resolve node from nodeId in actionState', () => {
      const node: Node = { ...mockNode, id: 'node1' };
      context.nodesMap = new Map([['node1', node]]);
      mockActionStateManager.rotation = { nodeId: 'node1' };

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledWith('nodeRotateEnded', { node });
    });

    it('should not emit when rotation state is undefined', () => {
      mockActionStateManager.rotation = undefined;

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit when nodeId does not exist in nodesMap', () => {
      mockActionStateManager.rotation = { nodeId: 'nonexistent' };
      context.nodesMap = new Map();

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});
