import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../../../event-manager/event-manager';
import type { SelectionRemovedEvent } from '../../../../../event-manager/event-types';
import { mockNode } from '../../../../../test-utils';
import type { Edge, MiddlewareContext, Node } from '../../../../../types';
import { SelectionRemovedEmitter } from '../selection-removed.emitter';

describe('SelectionRemovedEmitter', () => {
  let emitter: SelectionRemovedEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;

  beforeEach(() => {
    emitter = new SelectionRemovedEmitter();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: emitSpy,
    } as unknown as EventManager;

    context = {
      modelActionType: 'deleteSelection',
      initialNodesMap: new Map<string, Node>(),
      initialEdgesMap: new Map<string, Edge>(),
      nodesMap: new Map<string, Node>(),
      edgesMap: new Map<string, Edge>(),
    } as unknown as MiddlewareContext;
  });

  describe('modelActionType filtering', () => {
    it('should not emit event when modelActionType is not deleteSelection', () => {
      context.modelActionType = 'addNodes';

      const node: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 } };
      context.initialNodesMap.set('node1', node);
      // Node not in final state (deleted) but wrong action type

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should check for deleteSelection action type', () => {
      context.modelActionType = 'deleteSelection';

      const node: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 } };
      context.initialNodesMap.set('node1', node);
      // Node deleted (not in final state)

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledOnce();
    });
  });

  describe('deleting nodes', () => {
    it('should emit event when single node is deleted', () => {
      const deletedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };

      context.initialNodesMap.set('node1', deletedNode);
      // Node not in final state (deleted)

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRemovedEvent = {
        deletedNodes: [deletedNode],
        deletedEdges: [],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRemoved', expectedEvent);
    });

    it('should emit event when multiple nodes are deleted', () => {
      const deletedNode1: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };
      const deletedNode2: Node = { ...mockNode, id: 'node2', position: { x: 200, y: 200 } };

      context.initialNodesMap.set('node1', deletedNode1);
      context.initialNodesMap.set('node2', deletedNode2);
      // Both nodes not in final state (deleted)

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRemovedEvent = {
        deletedNodes: [deletedNode1, deletedNode2],
        deletedEdges: [],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRemoved', expectedEvent);
    });

    it('should not include nodes that still exist in final state', () => {
      const deletedNode: Node = { ...mockNode, id: 'deleted', position: { x: 100, y: 100 } };
      const remainingNode: Node = { ...mockNode, id: 'remaining', position: { x: 200, y: 200 } };

      context.initialNodesMap.set('deleted', deletedNode);
      context.initialNodesMap.set('remaining', remainingNode);
      context.nodesMap.set('remaining', remainingNode);

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRemovedEvent = {
        deletedNodes: [deletedNode],
        deletedEdges: [],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRemoved', expectedEvent);
      expect(emitSpy.mock.calls[0][1].deletedNodes).toHaveLength(1);
      expect(emitSpy.mock.calls[0][1].deletedNodes[0].id).toBe('deleted');
    });
  });

  describe('deleting edges', () => {
    it('should emit event when single edge is deleted', () => {
      const deletedEdge: Edge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        data: {},
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 100, y: 100 },
      };

      context.initialEdgesMap.set('edge1', deletedEdge);
      // Edge not in final state (deleted)

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRemovedEvent = {
        deletedNodes: [],
        deletedEdges: [deletedEdge],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRemoved', expectedEvent);
    });

    it('should emit event when multiple edges are deleted', () => {
      const deletedEdge1: Edge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        data: {},
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 100, y: 100 },
      };
      const deletedEdge2: Edge = {
        id: 'edge2',
        source: 'node2',
        target: 'node3',
        data: {},
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 },
      };

      context.initialEdgesMap.set('edge1', deletedEdge1);
      context.initialEdgesMap.set('edge2', deletedEdge2);
      // Both edges not in final state (deleted)

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRemovedEvent = {
        deletedNodes: [],
        deletedEdges: [deletedEdge1, deletedEdge2],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRemoved', expectedEvent);
    });

    it('should not include edges that still exist in final state', () => {
      const deletedEdge: Edge = {
        id: 'deleted',
        source: 'node1',
        target: 'node2',
        data: {},
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 100, y: 100 },
      };
      const remainingEdge: Edge = {
        id: 'remaining',
        source: 'node3',
        target: 'node4',
        data: {},
        sourcePosition: { x: 200, y: 200 },
        targetPosition: { x: 300, y: 300 },
      };

      context.initialEdgesMap.set('deleted', deletedEdge);
      context.initialEdgesMap.set('remaining', remainingEdge);
      context.edgesMap.set('remaining', remainingEdge);

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRemovedEvent = {
        deletedNodes: [],
        deletedEdges: [deletedEdge],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRemoved', expectedEvent);
      expect(emitSpy.mock.calls[0][1].deletedEdges).toHaveLength(1);
      expect(emitSpy.mock.calls[0][1].deletedEdges[0].id).toBe('deleted');
    });
  });

  describe('deleting both nodes and edges', () => {
    it('should emit event when both nodes and edges are deleted', () => {
      const deletedNode1: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };
      const deletedNode2: Node = { ...mockNode, id: 'node2', position: { x: 200, y: 200 } };
      const deletedEdge: Edge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        data: {},
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 },
      };

      context.initialNodesMap.set('node1', deletedNode1);
      context.initialNodesMap.set('node2', deletedNode2);
      context.initialEdgesMap.set('edge1', deletedEdge);
      // All items not in final state (deleted)

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRemovedEvent = {
        deletedNodes: [deletedNode1, deletedNode2],
        deletedEdges: [deletedEdge],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRemoved', expectedEvent);
    });

    it('should handle complex deletion scenario with some items remaining', () => {
      // Items to delete
      const deletedNode1: Node = { ...mockNode, id: 'deleted-node1', position: { x: 100, y: 100 } };
      const deletedNode2: Node = { ...mockNode, id: 'deleted-node2', position: { x: 200, y: 200 } };
      const deletedEdge1: Edge = {
        id: 'deleted-edge1',
        source: 'deleted-node1',
        target: 'deleted-node2',
        data: {},
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 },
      };

      // Items to keep
      const remainingNode: Node = { ...mockNode, id: 'remaining-node', position: { x: 300, y: 300 } };
      const remainingEdge: Edge = {
        id: 'remaining-edge',
        source: 'remaining-node',
        target: 'remaining-node',
        data: {},
        sourcePosition: { x: 300, y: 300 },
        targetPosition: { x: 300, y: 300 },
      };

      // Setup initial state (everything exists)
      context.initialNodesMap.set('deleted-node1', deletedNode1);
      context.initialNodesMap.set('deleted-node2', deletedNode2);
      context.initialNodesMap.set('remaining-node', remainingNode);
      context.initialEdgesMap.set('deleted-edge1', deletedEdge1);
      context.initialEdgesMap.set('remaining-edge', remainingEdge);

      // Setup final state (only remaining items)
      context.nodesMap.set('remaining-node', remainingNode);
      context.edgesMap.set('remaining-edge', remainingEdge);

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRemovedEvent = {
        deletedNodes: [deletedNode1, deletedNode2],
        deletedEdges: [deletedEdge1],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRemoved', expectedEvent);
    });
  });

  describe('middleware restoration scenarios', () => {
    it('should not emit event for nodes that middleware restored', () => {
      const restoredNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };

      context.initialNodesMap.set('node1', restoredNode);
      context.nodesMap.set('node1', restoredNode);
      // Node was requested to be deleted but middleware restored it

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit event for edges that middleware restored', () => {
      const restoredEdge: Edge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        data: {},
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 100, y: 100 },
      };

      context.initialEdgesMap.set('edge1', restoredEdge);
      context.edgesMap.set('edge1', restoredEdge);
      // Edge was requested to be deleted but middleware restored it

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should only report actually deleted items when middleware restores some', () => {
      const deletedNode: Node = { ...mockNode, id: 'deleted', position: { x: 100, y: 100 } };
      const restoredNode: Node = { ...mockNode, id: 'restored', position: { x: 200, y: 200 } };
      const deletedEdge: Edge = {
        id: 'deleted-edge',
        source: 'node1',
        target: 'node2',
        data: {},
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 100, y: 100 },
      };
      const restoredEdge: Edge = {
        id: 'restored-edge',
        source: 'node3',
        target: 'node4',
        data: {},
        sourcePosition: { x: 200, y: 200 },
        targetPosition: { x: 300, y: 300 },
      };

      // Initial state: all items exist
      context.initialNodesMap.set('deleted', deletedNode);
      context.initialNodesMap.set('restored', restoredNode);
      context.initialEdgesMap.set('deleted-edge', deletedEdge);
      context.initialEdgesMap.set('restored-edge', restoredEdge);

      // Final state: middleware restored some items
      context.nodesMap.set('restored', restoredNode);
      context.edgesMap.set('restored-edge', restoredEdge);

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRemovedEvent = {
        deletedNodes: [deletedNode],
        deletedEdges: [deletedEdge],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRemoved', expectedEvent);
      expect(emitSpy.mock.calls[0][1].deletedNodes).toHaveLength(1);
      expect(emitSpy.mock.calls[0][1].deletedEdges).toHaveLength(1);
    });
  });

  describe('empty deletion scenarios', () => {
    it('should not emit event when nothing is deleted', () => {
      const node: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };
      const edge: Edge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        data: {},
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 100, y: 100 },
      };

      context.initialNodesMap.set('node1', node);
      context.initialEdgesMap.set('edge1', edge);
      context.nodesMap.set('node1', node);
      context.edgesMap.set('edge1', edge);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit event when both maps are empty', () => {
      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit event when selection exists but middleware prevents all deletions', () => {
      const node1: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };
      const node2: Node = { ...mockNode, id: 'node2', position: { x: 200, y: 200 } };
      const edge: Edge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        data: {},
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 },
      };

      // Initial state: all items exist
      context.initialNodesMap.set('node1', node1);
      context.initialNodesMap.set('node2', node2);
      context.initialEdgesMap.set('edge1', edge);

      // Final state: middleware prevented all deletions
      context.nodesMap.set('node1', node1);
      context.nodesMap.set('node2', node2);
      context.edgesMap.set('edge1', edge);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle partial deletion from large selection', () => {
      const nodes: Node[] = [];
      const deletedNodes: Node[] = [];

      // Create 10 nodes
      for (let i = 1; i <= 10; i++) {
        const node: Node = { ...mockNode, id: `node${i}`, position: { x: i * 100, y: 100 } };
        nodes.push(node);
        context.initialNodesMap.set(`node${i}`, node);
      }

      // Middleware only allows deletion of even-numbered nodes
      for (let i = 1; i <= 10; i++) {
        const node = nodes[i - 1];
        if (i % 2 === 1) {
          // Odd nodes restored
          context.nodesMap.set(`node${i}`, node);
        } else {
          // Even nodes deleted
          deletedNodes.push(node);
        }
      }

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy.mock.calls[0][1].deletedNodes).toHaveLength(5);
      expect(emitSpy.mock.calls[0][1].deletedNodes).toEqual(deletedNodes);
    });

    it('should handle edge deletion when source and target nodes are also deleted', () => {
      const node1: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };
      const node2: Node = { ...mockNode, id: 'node2', position: { x: 200, y: 200 } };
      const edge: Edge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        data: {},
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 },
      };

      context.initialNodesMap.set('node1', node1);
      context.initialNodesMap.set('node2', node2);
      context.initialEdgesMap.set('edge1', edge);
      // All items deleted (not in final state)

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRemovedEvent = {
        deletedNodes: [node1, node2],
        deletedEdges: [edge],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRemoved', expectedEvent);
    });

    it('should handle node deletion without edges', () => {
      const node1: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };
      const node2: Node = { ...mockNode, id: 'node2', position: { x: 200, y: 200 } };

      context.initialNodesMap.set('node1', node1);
      context.initialNodesMap.set('node2', node2);
      // No edges

      emitter.emit(context, eventManager);

      const expectedEvent: SelectionRemovedEvent = {
        deletedNodes: [node1, node2],
        deletedEdges: [],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('selectionRemoved', expectedEvent);
      expect(emitSpy.mock.calls[0][1].deletedEdges).toHaveLength(0);
    });
  });
});
