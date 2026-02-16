import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../../../event-manager/event-manager';
import { mockNode } from '../../../../../test-utils';
import type { MiddlewareContext, Node } from '../../../../../types';
import { NodeDragStartedEmitter } from '../node-drag-started.emitter';

describe('NodeDragStartedEmitter', () => {
  let emitter: NodeDragStartedEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;

  beforeEach(() => {
    emitter = new NodeDragStartedEmitter();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: emitSpy,
    } as unknown as EventManager;

    context = {
      modelActionType: 'moveNodesStart',
      modelActionTypes: ['moveNodesStart'],
      nodesMap: new Map<string, Node>(),
      initialUpdate: {},
      history: [],
    } as unknown as MiddlewareContext;
  });

  describe('action type filtering', () => {
    it('should not emit when action type is not moveNodesStart', () => {
      context.modelActionTypes = ['moveNodesBy'];

      const node: Node = { ...mockNode, id: 'node1', selected: true };
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit for moveNodesStart action', () => {
      context.modelActionTypes = ['moveNodesStart'];

      const node: Node = { ...mockNode, id: 'node1', selected: true };
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('nodeDragStarted', { nodes: [node] });
    });
  });

  describe('node resolution', () => {
    it('should include only selected nodes', () => {
      const selectedNode: Node = { ...mockNode, id: 'node1', selected: true };
      const unselectedNode: Node = { ...mockNode, id: 'node2', selected: false };
      context.nodesMap.set('node1', selectedNode);
      context.nodesMap.set('node2', unselectedNode);

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledWith('nodeDragStarted', { nodes: [selectedNode] });
    });

    it('should not emit when no selected nodes exist', () => {
      const node: Node = { ...mockNode, id: 'node1', selected: false };
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should include multiple selected nodes', () => {
      const node1: Node = { ...mockNode, id: 'node1', selected: true };
      const node2: Node = { ...mockNode, id: 'node2', selected: true };
      context.nodesMap.set('node1', node1);
      context.nodesMap.set('node2', node2);

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledWith('nodeDragStarted', { nodes: [node1, node2] });
    });
  });

  describe('children of selected groups', () => {
    it('should include children of a selected group', () => {
      const group: Node = { ...mockNode, id: 'group1', selected: true };
      const child: Node = { ...mockNode, id: 'child1', selected: false, groupId: 'group1' };
      context.nodesMap.set('group1', group);
      context.nodesMap.set('child1', child);

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledWith('nodeDragStarted', { nodes: [group, child] });
    });

    it('should include deeply nested children', () => {
      const group: Node = { ...mockNode, id: 'group1', selected: true };
      const child: Node = { ...mockNode, id: 'child1', selected: false, groupId: 'group1' };
      const grandchild: Node = { ...mockNode, id: 'grandchild1', selected: false, groupId: 'child1' };
      context.nodesMap.set('group1', group);
      context.nodesMap.set('child1', child);
      context.nodesMap.set('grandchild1', grandchild);

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledWith('nodeDragStarted', { nodes: [group, child, grandchild] });
    });

    it('should exclude non-draggable children of a selected group', () => {
      const group: Node = { ...mockNode, id: 'group1', selected: true };
      const draggableChild: Node = { ...mockNode, id: 'child1', selected: false, groupId: 'group1' };
      const nonDraggableChild: Node = {
        ...mockNode,
        id: 'child2',
        selected: false,
        groupId: 'group1',
        draggable: false,
      };
      context.nodesMap.set('group1', group);
      context.nodesMap.set('child1', draggableChild);
      context.nodesMap.set('child2', nonDraggableChild);

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledWith('nodeDragStarted', { nodes: [group, draggableChild] });
    });
  });

  describe('draggable filtering', () => {
    it('should exclude nodes with draggable set to false', () => {
      const draggableNode: Node = { ...mockNode, id: 'node1', selected: true, draggable: true };
      const nonDraggableNode: Node = { ...mockNode, id: 'node2', selected: true, draggable: false };
      context.nodesMap.set('node1', draggableNode);
      context.nodesMap.set('node2', nonDraggableNode);

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledWith('nodeDragStarted', { nodes: [draggableNode] });
    });

    it('should include nodes without draggable property (defaults to true)', () => {
      const node: Node = { ...mockNode, id: 'node1', selected: true };
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledWith('nodeDragStarted', { nodes: [node] });
    });

    it('should not emit when all selected nodes are non-draggable', () => {
      const node: Node = { ...mockNode, id: 'node1', selected: true, draggable: false };
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});
