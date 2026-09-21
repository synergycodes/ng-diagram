import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../../../event-manager/event-manager';
import { mockEdge, mockNode } from '../../../../../test-utils';
import type { Edge, LinkingActionState, MiddlewareContext, Node } from '../../../../../types';
import { EdgeRelinkEndedEmitter, EdgeRelinkStartedEmitter } from '../edge-relink.emitter';

describe('EdgeRelink emitters', () => {
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let mockActionStateManager: { linking: LinkingActionState | undefined };
  let context: MiddlewareContext;

  const previousNode: Node = { ...mockNode, id: 'node-b' };
  const newNode: Node = { ...mockNode, id: 'node-c' };
  const dropPosition = { x: 100, y: 200 };

  const originalEdge: Edge = {
    ...mockEdge,
    id: 'edge-1',
    source: 'node-a',
    sourcePort: 'out',
    target: 'node-b',
    targetPort: 'in',
  };

  beforeEach(() => {
    emitSpy = vi.fn();
    eventManager = { deferredEmit: emitSpy } as unknown as EventManager;
    mockActionStateManager = { linking: undefined };

    context = {
      modelActionTypes: ['finishRelinking'],
      nodesMap: new Map<string, Node>(),
      edgesMap: new Map<string, Edge>(),
      actionStateManager: mockActionStateManager,
    } as unknown as MiddlewareContext;

    context.nodesMap.set('node-a', { ...mockNode, id: 'node-a' });
    context.nodesMap.set('node-b', previousNode);
    context.nodesMap.set('node-c', newNode);
  });

  describe('EdgeRelinkStartedEmitter', () => {
    let emitter: EdgeRelinkStartedEmitter;

    beforeEach(() => {
      emitter = new EdgeRelinkStartedEmitter();
      context.modelActionTypes = ['startRelinking'];
      mockActionStateManager.linking = {
        sourceNodeId: 'node-a',
        sourcePortId: 'out',
        temporaryEdge: null,
        relink: { edgeId: 'edge-1', end: 'target', originalEdge },
      };
    });

    it('should emit edgeRelinkStarted with the original edge and dragged end', () => {
      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('edgeRelinkStarted', {
        edge: originalEdge,
        end: 'target',
      });
    });

    it('should not emit when the action type is not startRelinking', () => {
      context.modelActionTypes = ['startLinking'];

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit without a relink state', () => {
      mockActionStateManager.linking = {
        sourceNodeId: 'node-a',
        sourcePortId: 'out',
        temporaryEdge: null,
      };

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('EdgeRelinkEndedEmitter', () => {
    let emitter: EdgeRelinkEndedEmitter;

    beforeEach(() => {
      emitter = new EdgeRelinkEndedEmitter();
    });

    it('should not emit when the action type is not finishRelinking', () => {
      context.modelActionTypes = ['finishLinking'];
      mockActionStateManager.linking = {
        sourceNodeId: 'node-a',
        sourcePortId: 'out',
        temporaryEdge: null,
        relink: { edgeId: 'edge-1', end: 'target', originalEdge },
      };

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit without a relink state', () => {
      mockActionStateManager.linking = {
        sourceNodeId: 'node-a',
        sourcePortId: 'out',
        temporaryEdge: null,
      };

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit a success event with the reconnected edge and resolved nodes', () => {
      const reconnectedEdge: Edge = { ...originalEdge, target: 'node-c', targetPort: 'in-c' };
      context.edgesMap.set('edge-1', reconnectedEdge);
      mockActionStateManager.linking = {
        sourceNodeId: 'node-a',
        sourcePortId: 'out',
        temporaryEdge: null,
        dropPosition,
        relink: { edgeId: 'edge-1', end: 'target', originalEdge },
      };

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('edgeRelinkEnded', {
        edge: reconnectedEdge,
        end: 'target',
        previousNode,
        previousPort: 'in',
        previousPosition: undefined,
        dropPosition,
        success: true,
        target: newNode,
        targetPort: 'in-c',
        reason: undefined,
      });
    });

    it('should emit a failure event with the original edge and the cancel reason', () => {
      // The failed relink never changed the model — the edge is still there.
      context.edgesMap.set('edge-1', originalEdge);
      mockActionStateManager.linking = {
        sourceNodeId: 'node-a',
        sourcePortId: 'out',
        temporaryEdge: null,
        dropPosition,
        relinkCancelReason: 'invalidConnection',
        relink: { edgeId: 'edge-1', end: 'target', originalEdge },
      };

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('edgeRelinkEnded', {
        edge: originalEdge,
        end: 'target',
        previousNode,
        previousPort: 'in',
        previousPosition: undefined,
        dropPosition,
        success: false,
        target: undefined,
        targetPort: undefined,
        reason: 'invalidConnection',
      });
    });

    it('should include previousPosition only when the endpoint was previously dangling', () => {
      const danglingOriginal: Edge = {
        ...originalEdge,
        target: '',
        targetPort: undefined,
        targetPosition: { x: 55, y: 66 },
      };
      const reconnectedEdge: Edge = { ...danglingOriginal, target: 'node-c', targetPort: 'in-c' };
      context.edgesMap.set('edge-1', reconnectedEdge);
      mockActionStateManager.linking = {
        sourceNodeId: 'node-a',
        sourcePortId: 'out',
        temporaryEdge: null,
        dropPosition,
        relink: { edgeId: 'edge-1', end: 'target', originalEdge: danglingOriginal },
      };

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledOnce();
      const event = emitSpy.mock.calls[0][1];
      expect(event.previousNode).toBeUndefined();
      expect(event.previousPort).toBeUndefined();
      expect(event.previousPosition).toEqual({ x: 55, y: 66 });
      expect(event.success).toBe(true);
      expect(event.target).toBe(newNode);
    });

    it('should fall back to the original edge when the reconnected edge is missing from the map', () => {
      mockActionStateManager.linking = {
        sourceNodeId: 'node-a',
        sourcePortId: 'out',
        temporaryEdge: null,
        dropPosition,
        relink: { edgeId: 'edge-1', end: 'target', originalEdge },
      };

      emitter.emit(context, eventManager);

      expect(emitSpy.mock.calls[0][1].edge).toBe(originalEdge);
    });

    it('should default the drop position to {x: 0, y: 0}', () => {
      context.edgesMap.set('edge-1', originalEdge);
      mockActionStateManager.linking = {
        sourceNodeId: 'node-a',
        sourcePortId: 'out',
        temporaryEdge: null,
        relinkCancelReason: 'cancelled',
        relink: { edgeId: 'edge-1', end: 'target', originalEdge },
      };

      emitter.emit(context, eventManager);

      expect(emitSpy.mock.calls[0][1].dropPosition).toEqual({ x: 0, y: 0 });
    });

    it('should resolve previous data from the source end when relinking the source', () => {
      const reconnectedEdge: Edge = { ...originalEdge, source: 'node-c', sourcePort: 'out-c' };
      context.edgesMap.set('edge-1', reconnectedEdge);
      mockActionStateManager.linking = {
        sourceNodeId: 'node-a',
        sourcePortId: 'out',
        temporaryEdge: null,
        dropPosition,
        relink: { edgeId: 'edge-1', end: 'source', originalEdge },
      };

      emitter.emit(context, eventManager);

      const event = emitSpy.mock.calls[0][1];
      expect(event.previousNode).toBe(context.nodesMap.get('node-a'));
      expect(event.previousPort).toBe('out');
      expect(event.target).toBe(newNode);
      expect(event.targetPort).toBe('out-c');
    });
  });
});
