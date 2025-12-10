import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../../../event-manager/event-manager';
import type { NodeResizedEvent } from '../../../../../event-manager/event-types';
import { mockNode } from '../../../../../test-utils';
import type { MiddlewareContext, Node } from '../../../../../types';
import { NodeResizedEmitter } from '../size-changed.emitter';

describe('NodeResizedEmitter', () => {
  let emitter: NodeResizedEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;

  beforeEach(() => {
    emitter = new NodeResizedEmitter();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: emitSpy,
    } as unknown as EventManager;

    context = {
      modelActionType: 'resizeNode',
      modelActionTypes: ['resizeNode'],
      initialNodesMap: new Map<string, Node>(),
      nodesMap: new Map<string, Node>(),
      initialUpdate: {},
    } as unknown as MiddlewareContext;
  });

  describe('modelActionType filtering', () => {
    it('should not emit event when modelActionType is not resizeNode', () => {
      context.modelActionTypes = ['addNodes'];
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      };
      const resizedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 200 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 200, height: 200 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', resizedNode);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should check for resizeNode action type', () => {
      context.modelActionTypes = ['resizeNode'];
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      };
      const resizedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 200 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 200, height: 200 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', resizedNode);

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledOnce();
    });
  });

  describe('node request validation', () => {
    it('should not emit event when initialUpdate.nodesToUpdate is undefined', () => {
      context.initialUpdate = {};

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit event when initialUpdate.nodesToUpdate is empty array', () => {
      context.initialUpdate = { nodesToUpdate: [] };

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit event when node does not exist in initial state', () => {
      const resizedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 200 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 200, height: 200 } }] };
      context.nodesMap.set('node1', resizedNode);
      // Node not in initialNodesMap

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit event when node does not exist in current state', () => {
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 200, height: 200 } }] };
      context.initialNodesMap.set('node1', initialNode);
      // Node not in nodesMap (rejected by middleware)

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('size existence validation', () => {
    it('should not emit event when initial node has no size', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 } };
      const resizedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 200 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 200, height: 200 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', resizedNode);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit event when current node has no size', () => {
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      };
      const currentNode: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 } };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1' }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', currentNode);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit event when both nodes have no size', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 } };
      const currentNode: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 } };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1' }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', currentNode);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('size change scenarios', () => {
    it('should emit event when width changes', () => {
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
      };
      const resizedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 200, height: 100 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', resizedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: NodeResizedEvent = {
        node: resizedNode,
        previousSize: { width: 100, height: 100 },
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeResized', expectedEvent);
    });

    it('should emit event when height changes', () => {
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
      };
      const resizedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 200 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 100, height: 200 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', resizedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: NodeResizedEvent = {
        node: resizedNode,
        previousSize: { width: 100, height: 100 },
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeResized', expectedEvent);
    });

    it('should emit event when both width and height change', () => {
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
      };
      const resizedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 250, height: 300 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 250, height: 300 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', resizedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: NodeResizedEvent = {
        node: resizedNode,
        previousSize: { width: 100, height: 100 },
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeResized', expectedEvent);
    });

    it('should not emit event when size does not change', () => {
      const node: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 100, height: 100 } }] };
      context.initialNodesMap.set('node1', node);
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit event with node from current state not initial', () => {
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
        data: {},
      };
      const resizedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        data: { modified: true },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 200, height: 150 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', resizedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: NodeResizedEvent = {
        node: resizedNode,
        previousSize: { width: 100, height: 100 },
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeResized', expectedEvent);
      expect(emitSpy.mock.calls[0][1].node.data).toEqual({ modified: true });
    });
  });

  describe('middleware rejection scenarios', () => {
    it('should not emit event when middleware rejects the resize', () => {
      const node: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 200, height: 200 } }] };
      context.initialNodesMap.set('node1', node);
      context.nodesMap.set('node1', node);
      // Middleware kept size at 100x100, rejecting the resize

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit event when middleware reverts size to initial', () => {
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 150, height: 150 },
      };
      const finalNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 150, height: 150 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 300, height: 300 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', finalNode);
      // Middleware reverted size back to 150x150

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('middleware transformation scenarios', () => {
    it('should report size after middleware minimum constraint', () => {
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
      };
      const constrainedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 50, height: 50 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 10, height: 10 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', constrainedNode);
      // Middleware enforced minimum 50x50

      emitter.emit(context, eventManager);

      const expectedEvent: NodeResizedEvent = {
        node: constrainedNode,
        previousSize: { width: 100, height: 100 },
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeResized', expectedEvent);
      expect(emitSpy.mock.calls[0][1].node.size).toEqual({ width: 50, height: 50 });
    });

    it('should report size after middleware maximum constraint', () => {
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
      };
      const constrainedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 500, height: 500 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 1000, height: 1000 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', constrainedNode);
      // Middleware enforced maximum 500x500

      emitter.emit(context, eventManager);

      const expectedEvent: NodeResizedEvent = {
        node: constrainedNode,
        previousSize: { width: 100, height: 100 },
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeResized', expectedEvent);
      expect(emitSpy.mock.calls[0][1].node.size).toEqual({ width: 500, height: 500 });
    });

    it('should report size after middleware aspect ratio preservation', () => {
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
      };
      const adjustedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 200 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 200, height: 150 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', adjustedNode);
      // Middleware enforced 1:1 aspect ratio

      emitter.emit(context, eventManager);

      const expectedEvent: NodeResizedEvent = {
        node: adjustedNode,
        previousSize: { width: 100, height: 100 },
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeResized', expectedEvent);
      expect(emitSpy.mock.calls[0][1].node.size).toEqual({ width: 200, height: 200 });
    });

    it('should report node with middleware-modified properties', () => {
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
        data: {},
      };
      const modifiedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        data: { resized: true, timestamp: '2024-01-01' },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 200, height: 150 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', modifiedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: NodeResizedEvent = {
        node: modifiedNode,
        previousSize: { width: 100, height: 100 },
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeResized', expectedEvent);
      expect(emitSpy.mock.calls[0][1].node.data).toEqual({ resized: true, timestamp: '2024-01-01' });
    });

    it('should report size after middleware snapping to grid', () => {
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
      };
      const snappedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 160 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 197.3, height: 158.7 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', snappedNode);
      // Middleware snapped to 20px grid

      emitter.emit(context, eventManager);

      const expectedEvent: NodeResizedEvent = {
        node: snappedNode,
        previousSize: { width: 100, height: 100 },
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeResized', expectedEvent);
      expect(emitSpy.mock.calls[0][1].node.size).toEqual({ width: 200, height: 160 });
    });
  });

  describe('edge cases', () => {
    it('should handle resize to very small dimensions', () => {
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
      };
      const resizedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 1, height: 1 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 1, height: 1 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', resizedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: NodeResizedEvent = {
        node: resizedNode,
        previousSize: { width: 100, height: 100 },
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeResized', expectedEvent);
    });

    it('should handle resize to very large dimensions', () => {
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
      };
      const resizedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 10000, height: 10000 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 10000, height: 10000 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', resizedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: NodeResizedEvent = {
        node: resizedNode,
        previousSize: { width: 100, height: 100 },
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeResized', expectedEvent);
    });

    it('should handle decimal size values', () => {
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100.5, height: 100.5 },
      };
      const resizedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 150.75, height: 125.25 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 150.75, height: 125.25 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', resizedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: NodeResizedEvent = {
        node: resizedNode,
        previousSize: { width: 100.5, height: 100.5 },
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeResized', expectedEvent);
    });

    it('should handle very small size change', () => {
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100.0, height: 100.0 },
      };
      const resizedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100.001, height: 100.001 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 100.001, height: 100.001 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', resizedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: NodeResizedEvent = {
        node: resizedNode,
        previousSize: { width: 100.0, height: 100.0 },
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeResized', expectedEvent);
    });

    it('should only process first node from nodesToUpdate array', () => {
      const initialNode1: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
      };
      const initialNode2: Node = {
        ...mockNode,
        id: 'node2',
        position: { x: 200, y: 200 },
        size: { width: 100, height: 100 },
      };
      const resizedNode1: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 200 },
      };
      const resizedNode2: Node = {
        ...mockNode,
        id: 'node2',
        position: { x: 200, y: 200 },
        size: { width: 300, height: 300 },
      };

      context.initialUpdate = {
        nodesToUpdate: [
          { id: 'node1', size: { width: 200, height: 200 } },
          { id: 'node2', size: { width: 300, height: 300 } },
        ],
      };
      context.initialNodesMap.set('node1', initialNode1);
      context.initialNodesMap.set('node2', initialNode2);
      context.nodesMap.set('node1', resizedNode1);
      context.nodesMap.set('node2', resizedNode2);

      emitter.emit(context, eventManager);

      // Should only emit for first node
      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy.mock.calls[0][1].node.id).toBe('node1');
      expect(emitSpy.mock.calls[0][1].node.size).toEqual({ width: 200, height: 200 });
    });

    it('should handle non-uniform resize (different width and height changes)', () => {
      const initialNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 200 },
      };
      const resizedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 300, height: 250 },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', size: { width: 300, height: 250 } }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', resizedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: NodeResizedEvent = {
        node: resizedNode,
        previousSize: { width: 100, height: 200 },
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeResized', expectedEvent);
      expect(emitSpy.mock.calls[0][1].previousSize).toEqual({ width: 100, height: 200 });
      expect(emitSpy.mock.calls[0][1].node.size).toEqual({ width: 300, height: 250 });
    });
  });
});
