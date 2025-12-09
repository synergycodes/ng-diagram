import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../../../event-manager/event-manager';
import type { ClipboardPastedEvent } from '../../../../../event-manager/event-types';
import { mockNode } from '../../../../../test-utils';
import type { Edge, MiddlewareContext, Node } from '../../../../../types';
import { ClipboardPastedEmitter } from '../clipboard-paste.emitter';

describe('ClipboardPastedEmitter', () => {
  let emitter: ClipboardPastedEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;

  beforeEach(() => {
    emitter = new ClipboardPastedEmitter();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: emitSpy,
    } as unknown as EventManager;

    context = {
      modelActionType: 'paste',
      modelActionTypes: ['paste'],
      initialNodesMap: new Map<string, Node>(),
      initialEdgesMap: new Map<string, Edge>(),
      nodesMap: new Map<string, Node>(),
      edgesMap: new Map<string, Edge>(),
      actionStateManager: {
        getState: vi.fn().mockReturnValue({ copyPaste: {} }),
      },
    } as unknown as MiddlewareContext;
  });

  describe('modelActionType filtering', () => {
    it('should not emit event when modelActionType is not paste', () => {
      context.modelActionTypes = ['addNodes'];
      const node: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 } };
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit event for paste action', () => {
      context.modelActionTypes = ['paste'];
      const node: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 } };
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledOnce();
    });
  });

  describe('copyPaste state check', () => {
    it('should not emit event when copyPaste state does not exist', () => {
      vi.mocked(context.actionStateManager.getState).mockReturnValue({});

      const node: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 } };
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit event when copyPaste state is undefined', () => {
      vi.mocked(context.actionStateManager.getState).mockReturnValue({ copyPaste: undefined });

      const node: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 } };
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('pasting nodes', () => {
    it('should emit event when single node is pasted', () => {
      const pastedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };

      // Node exists in final state but not initial
      context.nodesMap.set('node1', pastedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: ClipboardPastedEvent = {
        nodes: [pastedNode],
        edges: [],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('clipboardPasted', expectedEvent);
    });

    it('should emit event when multiple nodes are pasted', () => {
      const pastedNode1: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };
      const pastedNode2: Node = { ...mockNode, id: 'node2', position: { x: 200, y: 200 } };

      context.nodesMap.set('node1', pastedNode1);
      context.nodesMap.set('node2', pastedNode2);

      emitter.emit(context, eventManager);

      const expectedEvent: ClipboardPastedEvent = {
        nodes: [pastedNode1, pastedNode2],
        edges: [],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('clipboardPasted', expectedEvent);
    });

    it('should not include nodes that existed in initial state', () => {
      const existingNode: Node = { ...mockNode, id: 'existing', position: { x: 0, y: 0 } };
      const pastedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };

      context.initialNodesMap.set('existing', existingNode);
      context.nodesMap.set('existing', existingNode);
      context.nodesMap.set('node1', pastedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: ClipboardPastedEvent = {
        nodes: [pastedNode],
        edges: [],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('clipboardPasted', expectedEvent);
    });
  });

  describe('pasting edges', () => {
    it('should emit event when single edge is pasted', () => {
      const pastedEdge: Edge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        data: {},
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 100, y: 100 },
      };

      context.edgesMap.set('edge1', pastedEdge);

      emitter.emit(context, eventManager);

      const expectedEvent: ClipboardPastedEvent = {
        nodes: [],
        edges: [pastedEdge],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('clipboardPasted', expectedEvent);
    });

    it('should emit event when multiple edges are pasted', () => {
      const pastedEdge1: Edge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        data: {},
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 100, y: 100 },
      };
      const pastedEdge2: Edge = {
        id: 'edge2',
        source: 'node2',
        target: 'node3',
        data: {},
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 },
      };

      context.edgesMap.set('edge1', pastedEdge1);
      context.edgesMap.set('edge2', pastedEdge2);

      emitter.emit(context, eventManager);

      const expectedEvent: ClipboardPastedEvent = {
        nodes: [],
        edges: [pastedEdge1, pastedEdge2],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('clipboardPasted', expectedEvent);
    });

    it('should not include edges that existed in initial state', () => {
      const existingEdge: Edge = {
        id: 'existing',
        source: 'node1',
        target: 'node2',
        data: {},
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 50, y: 50 },
      };
      const pastedEdge: Edge = {
        id: 'edge1',
        source: 'node3',
        target: 'node4',
        data: {},
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 },
      };

      context.initialEdgesMap.set('existing', existingEdge);
      context.edgesMap.set('existing', existingEdge);
      context.edgesMap.set('edge1', pastedEdge);

      emitter.emit(context, eventManager);

      const expectedEvent: ClipboardPastedEvent = {
        nodes: [],
        edges: [pastedEdge],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('clipboardPasted', expectedEvent);
    });
  });

  describe('pasting nodes and edges together', () => {
    it('should emit event when both nodes and edges are pasted', () => {
      const pastedNode1: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };
      const pastedNode2: Node = { ...mockNode, id: 'node2', position: { x: 200, y: 200 } };
      const pastedEdge: Edge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        data: {},
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 },
      };

      context.nodesMap.set('node1', pastedNode1);
      context.nodesMap.set('node2', pastedNode2);
      context.edgesMap.set('edge1', pastedEdge);

      emitter.emit(context, eventManager);

      const expectedEvent: ClipboardPastedEvent = {
        nodes: [pastedNode1, pastedNode2],
        edges: [pastedEdge],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('clipboardPasted', expectedEvent);
    });

    it('should emit event with complex paste scenario', () => {
      // Existing items
      const existingNode: Node = { ...mockNode, id: 'existing-node', position: { x: 0, y: 0 } };
      const existingEdge: Edge = {
        id: 'existing-edge',
        source: 'existing-node',
        target: 'existing-node',
        data: {},
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 0, y: 0 },
      };

      // Pasted items
      const pastedNode1: Node = { ...mockNode, id: 'pasted-node1', position: { x: 100, y: 100 } };
      const pastedNode2: Node = { ...mockNode, id: 'pasted-node2', position: { x: 200, y: 200 } };
      const pastedEdge1: Edge = {
        id: 'pasted-edge1',
        source: 'pasted-node1',
        target: 'pasted-node2',
        data: {},
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 },
      };
      const pastedEdge2: Edge = {
        id: 'pasted-edge2',
        source: 'pasted-node2',
        target: 'pasted-node1',
        data: {},
        sourcePosition: { x: 200, y: 200 },
        targetPosition: { x: 100, y: 100 },
      };

      // Setup initial state
      context.initialNodesMap.set('existing-node', existingNode);
      context.initialEdgesMap.set('existing-edge', existingEdge);

      // Setup final state (existing + pasted)
      context.nodesMap.set('existing-node', existingNode);
      context.nodesMap.set('pasted-node1', pastedNode1);
      context.nodesMap.set('pasted-node2', pastedNode2);
      context.edgesMap.set('existing-edge', existingEdge);
      context.edgesMap.set('pasted-edge1', pastedEdge1);
      context.edgesMap.set('pasted-edge2', pastedEdge2);

      emitter.emit(context, eventManager);

      const expectedEvent: ClipboardPastedEvent = {
        nodes: [pastedNode1, pastedNode2],
        edges: [pastedEdge1, pastedEdge2],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('clipboardPasted', expectedEvent);
    });
  });

  describe('empty paste scenarios', () => {
    it('should not emit event when nothing is pasted', () => {
      const existingNode: Node = { ...mockNode, id: 'existing', position: { x: 0, y: 0 } };
      context.initialNodesMap.set('existing', existingNode);
      context.nodesMap.set('existing', existingNode);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit event when both maps are empty', () => {
      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('middleware transformation scenarios', () => {
    it('should report actual pasted nodes after middleware modifications', () => {
      // Simulate middleware modifying position (e.g., snap-to-grid)
      const nodeWithModifiedPosition: Node = { ...mockNode, id: 'node1', position: { x: 120, y: 120 } };

      context.nodesMap.set('node1', nodeWithModifiedPosition);

      emitter.emit(context, eventManager);

      const expectedEvent: ClipboardPastedEvent = {
        nodes: [nodeWithModifiedPosition],
        edges: [],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('clipboardPasted', expectedEvent);
      expect(emitSpy.mock.calls[0][1].nodes[0].position).toEqual({ x: 120, y: 120 });
    });

    it('should not report nodes that were rejected by middleware', () => {
      // Simulate middleware rejecting node2
      const pastedNode1: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };

      context.nodesMap.set('node1', pastedNode1);
      // node2 was in clipboard but rejected by middleware, so not in nodesMap

      emitter.emit(context, eventManager);

      const expectedEvent: ClipboardPastedEvent = {
        nodes: [pastedNode1],
        edges: [],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('clipboardPasted', expectedEvent);
      expect(emitSpy.mock.calls[0][1].nodes).toHaveLength(1);
    });

    it('should report nodes with middleware-assigned IDs', () => {
      // Simulate middleware assigning new IDs to pasted nodes
      const nodeWithNewId: Node = { ...mockNode, id: 'generated-id-123', position: { x: 100, y: 100 } };

      context.nodesMap.set('generated-id-123', nodeWithNewId);

      emitter.emit(context, eventManager);

      const expectedEvent: ClipboardPastedEvent = {
        nodes: [nodeWithNewId],
        edges: [],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('clipboardPasted', expectedEvent);
      expect(emitSpy.mock.calls[0][1].nodes[0].id).toBe('generated-id-123');
    });
  });
});
