import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../../../event-manager/event-manager';
import type { SelectionChangedEvent } from '../../../../../event-manager/event-types';
import { mockEdge, mockNode } from '../../../../../test-utils';
import type { Edge, MiddlewareContext, Node } from '../../../../../types';
import { SelectionChangedEmitter } from '../selection-changed.emitter';

describe('SelectionChangedEmitter', () => {
  let emitter: SelectionChangedEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;

  beforeEach(() => {
    emitter = new SelectionChangedEmitter();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: emitSpy,
    } as unknown as EventManager;

    context = {
      modelActionType: 'changeSelection',
      initialNodesMap: new Map<string, Node>(),
      initialEdgesMap: new Map<string, Edge>(),
      nodesMap: new Map<string, Node>(),
      edgesMap: new Map<string, Edge>(),
    } as unknown as MiddlewareContext;
  });

  it('should not emit event when modelActionType is not changeSelection', () => {
    context.modelActionType = 'updateNode';

    const node: Node = { ...mockNode, id: 'node1', selected: true };
    context.nodesMap.set('node1', node);

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should not emit event when selection has not changed', () => {
    const node1: Node = { ...mockNode, id: 'node1', selected: true };
    const node2: Node = { ...mockNode, id: 'node2', selected: false };
    const edge1: Edge = { ...mockEdge, id: 'edge1', selected: true };

    context.initialNodesMap.set('node1', node1);
    context.initialNodesMap.set('node2', node2);
    context.initialEdgesMap.set('edge1', edge1);

    context.nodesMap.set('node1', node1);
    context.nodesMap.set('node2', node2);
    context.edgesMap.set('edge1', edge1);

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should emit event when node selection changes from none to one', () => {
    const node1Initial: Node = { ...mockNode, id: 'node1', selected: false };
    const node1Selected: Node = { ...mockNode, id: 'node1', selected: true };

    context.initialNodesMap.set('node1', node1Initial);
    context.nodesMap.set('node1', node1Selected);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionChangedEvent = {
      selectedNodes: [node1Selected],
      selectedEdges: [],
      previousNodes: [],
      previousEdges: [],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionChanged', expectedEvent);
  });

  it('should emit event when node selection changes from one to none', () => {
    const node1Selected: Node = { ...mockNode, id: 'node1', selected: true };
    const node1Deselected: Node = { ...mockNode, id: 'node1', selected: false };

    context.initialNodesMap.set('node1', node1Selected);
    context.nodesMap.set('node1', node1Deselected);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionChangedEvent = {
      selectedNodes: [],
      selectedEdges: [],
      previousNodes: [node1Selected],
      previousEdges: [],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionChanged', expectedEvent);
  });

  it('should emit event when multiple nodes are selected', () => {
    const node1Initial: Node = { ...mockNode, id: 'node1', selected: false };
    const node2Initial: Node = { ...mockNode, id: 'node2', selected: false };
    const node3Initial: Node = { ...mockNode, id: 'node3', selected: false };

    const node1Selected: Node = { ...mockNode, id: 'node1', selected: true };
    const node2Selected: Node = { ...mockNode, id: 'node2', selected: true };
    const node3Unselected: Node = { ...mockNode, id: 'node3', selected: false };

    context.initialNodesMap.set('node1', node1Initial);
    context.initialNodesMap.set('node2', node2Initial);
    context.initialNodesMap.set('node3', node3Initial);

    context.nodesMap.set('node1', node1Selected);
    context.nodesMap.set('node2', node2Selected);
    context.nodesMap.set('node3', node3Unselected);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionChangedEvent = {
      selectedNodes: [node1Selected, node2Selected],
      selectedEdges: [],
      previousNodes: [],
      previousEdges: [],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionChanged', expectedEvent);
  });

  it('should emit event when edge selection changes', () => {
    const edge1Initial: Edge = { ...mockEdge, id: 'edge1', selected: false };
    const edge1Selected: Edge = { ...mockEdge, id: 'edge1', selected: true };

    context.initialEdgesMap.set('edge1', edge1Initial);
    context.edgesMap.set('edge1', edge1Selected);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionChangedEvent = {
      selectedNodes: [],
      selectedEdges: [edge1Selected],
      previousNodes: [],
      previousEdges: [],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionChanged', expectedEvent);
  });

  it('should emit event when both nodes and edges selection changes', () => {
    const node1Initial: Node = { ...mockNode, id: 'node1', selected: true };
    const edge1Initial: Edge = { ...mockEdge, id: 'edge1', selected: false };

    const node1Deselected: Node = { ...mockNode, id: 'node1', selected: false };
    const edge1Selected: Edge = { ...mockEdge, id: 'edge1', selected: true };

    context.initialNodesMap.set('node1', node1Initial);
    context.initialEdgesMap.set('edge1', edge1Initial);

    context.nodesMap.set('node1', node1Deselected);
    context.edgesMap.set('edge1', edge1Selected);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionChangedEvent = {
      selectedNodes: [],
      selectedEdges: [edge1Selected],
      previousNodes: [node1Initial],
      previousEdges: [],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionChanged', expectedEvent);
  });

  it('should handle selection swap between nodes', () => {
    const node1InitialSelected: Node = { ...mockNode, id: 'node1', selected: true };
    const node2InitialUnselected: Node = { ...mockNode, id: 'node2', selected: false };

    const node1FinalUnselected: Node = { ...mockNode, id: 'node1', selected: false };
    const node2FinalSelected: Node = { ...mockNode, id: 'node2', selected: true };

    context.initialNodesMap.set('node1', node1InitialSelected);
    context.initialNodesMap.set('node2', node2InitialUnselected);

    context.nodesMap.set('node1', node1FinalUnselected);
    context.nodesMap.set('node2', node2FinalSelected);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionChangedEvent = {
      selectedNodes: [node2FinalSelected],
      selectedEdges: [],
      previousNodes: [node1InitialSelected],
      previousEdges: [],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionChanged', expectedEvent);
  });

  it('should handle deselecting all items', () => {
    const node1Selected: Node = { ...mockNode, id: 'node1', selected: true };
    const node2Selected: Node = { ...mockNode, id: 'node2', selected: true };
    const edge1Selected: Edge = { ...mockEdge, id: 'edge1', selected: true };

    const node1Deselected: Node = { ...mockNode, id: 'node1', selected: false };
    const node2Deselected: Node = { ...mockNode, id: 'node2', selected: false };
    const edge1Deselected: Edge = { ...mockEdge, id: 'edge1', selected: false };

    context.initialNodesMap.set('node1', node1Selected);
    context.initialNodesMap.set('node2', node2Selected);
    context.initialEdgesMap.set('edge1', edge1Selected);

    context.nodesMap.set('node1', node1Deselected);
    context.nodesMap.set('node2', node2Deselected);
    context.edgesMap.set('edge1', edge1Deselected);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionChangedEvent = {
      selectedNodes: [],
      selectedEdges: [],
      previousNodes: [node1Selected, node2Selected],
      previousEdges: [edge1Selected],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionChanged', expectedEvent);
  });

  it('should handle selecting all items', () => {
    const node1Unselected: Node = { ...mockNode, id: 'node1', selected: false };
    const node2Unselected: Node = { ...mockNode, id: 'node2', selected: false };
    const edge1Unselected: Edge = { ...mockEdge, id: 'edge1', selected: false };

    const node1Selected: Node = { ...mockNode, id: 'node1', selected: true };
    const node2Selected: Node = { ...mockNode, id: 'node2', selected: true };
    const edge1Selected: Edge = { ...mockEdge, id: 'edge1', selected: true };

    context.initialNodesMap.set('node1', node1Unselected);
    context.initialNodesMap.set('node2', node2Unselected);
    context.initialEdgesMap.set('edge1', edge1Unselected);

    context.nodesMap.set('node1', node1Selected);
    context.nodesMap.set('node2', node2Selected);
    context.edgesMap.set('edge1', edge1Selected);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionChangedEvent = {
      selectedNodes: [node1Selected, node2Selected],
      selectedEdges: [edge1Selected],
      previousNodes: [],
      previousEdges: [],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionChanged', expectedEvent);
  });

  it('should handle partial selection changes in mixed content', () => {
    // Initial state: node1 and edge1 selected
    const node1InitialSelected: Node = { ...mockNode, id: 'node1', selected: true };
    const node2InitialUnselected: Node = { ...mockNode, id: 'node2', selected: false };
    const edge1InitialSelected: Edge = { ...mockEdge, id: 'edge1', selected: true };
    const edge2InitialUnselected: Edge = { ...mockEdge, id: 'edge2', selected: false };

    // Final state: node2 and edge2 selected
    const node1FinalUnselected: Node = { ...mockNode, id: 'node1', selected: false };
    const node2FinalSelected: Node = { ...mockNode, id: 'node2', selected: true };
    const edge1FinalUnselected: Edge = { ...mockEdge, id: 'edge1', selected: false };
    const edge2FinalSelected: Edge = { ...mockEdge, id: 'edge2', selected: true };

    context.initialNodesMap.set('node1', node1InitialSelected);
    context.initialNodesMap.set('node2', node2InitialUnselected);
    context.initialEdgesMap.set('edge1', edge1InitialSelected);
    context.initialEdgesMap.set('edge2', edge2InitialUnselected);

    context.nodesMap.set('node1', node1FinalUnselected);
    context.nodesMap.set('node2', node2FinalSelected);
    context.edgesMap.set('edge1', edge1FinalUnselected);
    context.edgesMap.set('edge2', edge2FinalSelected);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionChangedEvent = {
      selectedNodes: [node2FinalSelected],
      selectedEdges: [edge2FinalSelected],
      previousNodes: [node1InitialSelected],
      previousEdges: [edge1InitialSelected],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionChanged', expectedEvent);
  });

  it('should not emit when selection order changes but selected items remain the same', () => {
    const node1: Node = { ...mockNode, id: 'node1', selected: true };
    const node2: Node = { ...mockNode, id: 'node2', selected: true };

    // Same nodes selected, potentially in different order in the map
    context.initialNodesMap.set('node1', node1);
    context.initialNodesMap.set('node2', node2);

    context.nodesMap.set('node2', node2);
    context.nodesMap.set('node1', node1);

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should emit event when only edges change and nodes remain the same', () => {
    const node1: Node = { ...mockNode, id: 'node1', selected: true };
    const edge1Initial: Edge = { ...mockEdge, id: 'edge1', selected: false };
    const edge2Initial: Edge = { ...mockEdge, id: 'edge2', selected: true };

    const edge1Final: Edge = { ...mockEdge, id: 'edge1', selected: true };
    const edge2Final: Edge = { ...mockEdge, id: 'edge2', selected: false };

    context.initialNodesMap.set('node1', node1);
    context.initialEdgesMap.set('edge1', edge1Initial);
    context.initialEdgesMap.set('edge2', edge2Initial);

    context.nodesMap.set('node1', node1);
    context.edgesMap.set('edge1', edge1Final);
    context.edgesMap.set('edge2', edge2Final);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionChangedEvent = {
      selectedNodes: [node1],
      selectedEdges: [edge1Final],
      previousNodes: [node1],
      previousEdges: [edge2Initial],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionChanged', expectedEvent);
  });
});
