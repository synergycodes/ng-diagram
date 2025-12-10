import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../../../event-manager/event-manager';
import type { SelectionRotatedEvent } from '../../../../../event-manager/event-types';
import { mockNode } from '../../../../../test-utils';
import type { MiddlewareContext, Node } from '../../../../../types';
import { SelectionRotatedEmitter } from '../selection-rotated.emitter';

describe('SelectionRotatedEmitter', () => {
  let emitter: SelectionRotatedEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;

  beforeEach(() => {
    emitter = new SelectionRotatedEmitter();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: emitSpy,
    } as unknown as EventManager;

    context = {
      modelActionType: 'rotateNodeTo',
      modelActionTypes: ['rotateNodeTo'],
      initialNodesMap: new Map<string, Node>(),
      nodesMap: new Map<string, Node>(),
      initialUpdate: {},
    } as unknown as MiddlewareContext;
  });

  describe('modelActionType filtering', () => {
    it('should not emit event when modelActionType is not rotateNodeTo', () => {
      context.modelActionTypes = ['addNodes'];
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 }, angle: 0 };
      const rotatedNode: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 }, angle: 45 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 45 }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', rotatedNode);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should check for rotateNodeTo action type', () => {
      context.modelActionTypes = ['rotateNodeTo'];
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 }, angle: 0 };
      const rotatedNode: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 }, angle: 45 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 45 }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', rotatedNode);

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
      const rotatedNode: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 }, angle: 45 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 45 }] };
      context.nodesMap.set('node1', rotatedNode);
      // Node not in initialNodesMap

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit event when node does not exist in current state', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 }, angle: 0 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 45 }] };
      context.initialNodesMap.set('node1', initialNode);
      // Node not in nodesMap (rejected by middleware)

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('rotation scenarios', () => {
    it('should emit event when node is rotated', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 0 };
      const rotatedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 45 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 45 }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', rotatedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRotatedEvent = {
        node: rotatedNode,
        angle: 45,
        previousAngle: 0,
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRotated', expectedEvent);
    });

    it('should not emit event when angle does not change', () => {
      const node: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 45 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 45 }] };
      context.initialNodesMap.set('node1', node);
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit event with node from current state not initial', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 0, data: {} };
      const rotatedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        angle: 90,
        data: { modified: true },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 90 }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', rotatedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRotatedEvent = {
        node: rotatedNode,
        angle: 90,
        previousAngle: 0,
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRotated', expectedEvent);
      expect(emitSpy.mock.calls[0][1].node.data).toEqual({ modified: true });
    });

    it('should handle rotation from undefined angle to defined angle', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };
      const rotatedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 30 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 30 }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', rotatedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRotatedEvent = {
        node: rotatedNode,
        angle: 30,
        previousAngle: 0,
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRotated', expectedEvent);
    });

    it('should handle rotation from defined angle to zero', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 45 };
      const rotatedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 0 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 0 }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', rotatedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRotatedEvent = {
        node: rotatedNode,
        angle: 0,
        previousAngle: 45,
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRotated', expectedEvent);
    });
  });

  describe('middleware rejection scenarios', () => {
    it('should not emit event when middleware rejects the rotation', () => {
      const node: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 0 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 45 }] };
      context.initialNodesMap.set('node1', node);
      context.nodesMap.set('node1', node);
      // Middleware kept angle at 0, rejecting the rotation

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit event when middleware reverts rotation to initial angle', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 30 };
      const finalNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 30 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 90 }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', finalNode);
      // Middleware reverted angle back to 30

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('middleware transformation scenarios', () => {
    it('should report angle after middleware snapping', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 0 };
      const snappedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 45 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 43.7 }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', snappedNode);
      // Middleware snapped 43.7 to 45

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRotatedEvent = {
        node: snappedNode,
        angle: 45,
        previousAngle: 0,
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRotated', expectedEvent);
      expect(emitSpy.mock.calls[0][1].angle).toBe(45);
    });

    it('should report angle after middleware clamping', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 0 };
      const clampedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 359 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 400 }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', clampedNode);
      // Middleware clamped 400 to 359 (or normalized to 40)

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRotatedEvent = {
        node: clampedNode,
        angle: 359,
        previousAngle: 0,
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRotated', expectedEvent);
      expect(emitSpy.mock.calls[0][1].angle).toBe(359);
    });

    it('should report node with middleware-modified properties', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 0, data: {} };
      const modifiedNode: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 100, y: 100 },
        angle: 90,
        data: { rotated: true, timestamp: '2024-01-01' },
      };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 90 }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', modifiedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRotatedEvent = {
        node: modifiedNode,
        angle: 90,
        previousAngle: 0,
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRotated', expectedEvent);
      expect(emitSpy.mock.calls[0][1].node.data).toEqual({ rotated: true, timestamp: '2024-01-01' });
    });
  });

  describe('edge cases', () => {
    it('should handle rotation to 360 degrees', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 0 };
      const rotatedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 360 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 360 }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', rotatedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRotatedEvent = {
        node: rotatedNode,
        angle: 360,
        previousAngle: 0,
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRotated', expectedEvent);
    });

    it('should handle negative angle rotation', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 0 };
      const rotatedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: -45 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: -45 }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', rotatedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRotatedEvent = {
        node: rotatedNode,
        angle: -45,
        previousAngle: 0,
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRotated', expectedEvent);
    });

    it('should handle decimal angle rotation', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 0 };
      const rotatedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 22.5 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 22.5 }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', rotatedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRotatedEvent = {
        node: rotatedNode,
        angle: 22.5,
        previousAngle: 0,
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRotated', expectedEvent);
    });

    it('should handle rotation with very small angle change', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 45.0 };
      const rotatedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 45.001 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 45.001 }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', rotatedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRotatedEvent = {
        node: rotatedNode,
        angle: 45.001,
        previousAngle: 45.0,
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRotated', expectedEvent);
    });

    it('should handle full rotation (360 degree change)', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 45 };
      const rotatedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 405 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 405 }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', rotatedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRotatedEvent = {
        node: rotatedNode,
        angle: 405,
        previousAngle: 45,
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRotated', expectedEvent);
    });

    it('should handle rotation between negative angles', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: -30 };
      const rotatedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: -90 };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: -90 }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', rotatedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRotatedEvent = {
        node: rotatedNode,
        angle: -90,
        previousAngle: -30,
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRotated', expectedEvent);
    });

    it('should only process first node from nodesToUpdate array', () => {
      const initialNode1: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 0 };
      const initialNode2: Node = { ...mockNode, id: 'node2', position: { x: 200, y: 200 }, angle: 0 };
      const rotatedNode1: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 45 };
      const rotatedNode2: Node = { ...mockNode, id: 'node2', position: { x: 200, y: 200 }, angle: 90 };

      context.initialUpdate = {
        nodesToUpdate: [
          { id: 'node1', angle: 45 },
          { id: 'node2', angle: 90 },
        ],
      };
      context.initialNodesMap.set('node1', initialNode1);
      context.initialNodesMap.set('node2', initialNode2);
      context.nodesMap.set('node1', rotatedNode1);
      context.nodesMap.set('node2', rotatedNode2);

      emitter.emit(context, eventManager);

      // Should only emit for first node
      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy.mock.calls[0][1].node.id).toBe('node1');
      expect(emitSpy.mock.calls[0][1].angle).toBe(45);
    });

    it('should handle rotation with undefined initial angle treated as 0', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };
      const rotatedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1', angle: 0 }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', rotatedNode);

      emitter.emit(context, eventManager);

      // Both undefined/0 angles should be treated as equal, no emission
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should handle rotation with undefined final angle treated as 0', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, angle: 45 };
      const rotatedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };

      context.initialUpdate = { nodesToUpdate: [{ id: 'node1' }] };
      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', rotatedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRotatedEvent = {
        node: rotatedNode,
        angle: 0,
        previousAngle: 45,
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRotated', expectedEvent);
    });
  });
});
