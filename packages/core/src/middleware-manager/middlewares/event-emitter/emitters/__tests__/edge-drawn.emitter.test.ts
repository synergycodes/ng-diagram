import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../../../event-manager/event-manager';
import type { EdgeDrawnEvent } from '../../../../../event-manager/event-types';
import { mockEdge, mockNode } from '../../../../../test-utils';
import type { Edge, MiddlewareContext, Node } from '../../../../../types';
import { EdgeDrawnEmitter } from '../edge-drawn.emitter';

describe('EdgeDrawnEmitter', () => {
  let emitter: EdgeDrawnEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;
  let helpers: {
    anyEdgesAdded: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    emitter = new EdgeDrawnEmitter();
    emitSpy = vi.fn();
    eventManager = {
      emit: emitSpy,
    } as unknown as EventManager;

    helpers = {
      anyEdgesAdded: vi.fn(),
    };

    context = {
      modelActionType: 'finishLinking',
      helpers: helpers as unknown as MiddlewareContext['helpers'],
      initialEdgesMap: new Map<string, Edge>(),
      edgesMap: new Map<string, Edge>(),
      nodesMap: new Map<string, Node>(),
    } as unknown as MiddlewareContext;
  });

  it('should not emit event when modelActionType is not finishLinking', () => {
    context.modelActionType = 'addEdges';
    helpers.anyEdgesAdded.mockReturnValue(true);

    const edge: Edge = { ...mockEdge, id: 'edge1', source: 'node1', target: 'node2' };
    context.edgesMap.set('edge1', edge);

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should not emit event when no edges were added', () => {
    helpers.anyEdgesAdded.mockReturnValue(false);

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should emit event for a newly added edge', () => {
    helpers.anyEdgesAdded.mockReturnValue(true);

    const sourceNode: Node = { ...mockNode, id: 'node1', type: 'input' };
    const targetNode: Node = { ...mockNode, id: 'node2', type: 'output' };
    const edge: Edge = { ...mockEdge, id: 'edge1', source: 'node1', target: 'node2' };

    context.nodesMap.set('node1', sourceNode);
    context.nodesMap.set('node2', targetNode);
    context.edgesMap.set('edge1', edge);

    emitter.emit(context, eventManager);

    const expectedEvent: EdgeDrawnEvent = {
      edge,
      source: sourceNode,
      target: targetNode,
      sourcePort: undefined,
      targetPort: undefined,
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('edgeDrawn', expectedEvent);
  });

  it('should emit event for edge with port information', () => {
    helpers.anyEdgesAdded.mockReturnValue(true);

    const sourceNode: Node = { ...mockNode, id: 'node1', type: 'input' };
    const targetNode: Node = { ...mockNode, id: 'node2', type: 'output' };
    const edge: Edge = {
      ...mockEdge,
      id: 'edge1',
      source: 'node1',
      target: 'node2',
      sourcePort: 'port1',
      targetPort: 'port2',
    };

    context.nodesMap.set('node1', sourceNode);
    context.nodesMap.set('node2', targetNode);
    context.edgesMap.set('edge1', edge);

    emitter.emit(context, eventManager);

    const expectedEvent: EdgeDrawnEvent = {
      edge,
      source: sourceNode,
      target: targetNode,
      sourcePort: 'port1',
      targetPort: 'port2',
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('edgeDrawn', expectedEvent);
  });

  it('should emit multiple events for multiple new edges', () => {
    helpers.anyEdgesAdded.mockReturnValue(true);

    const node1: Node = { ...mockNode, id: 'node1' };
    const node2: Node = { ...mockNode, id: 'node2' };
    const node3: Node = { ...mockNode, id: 'node3' };
    const edge1: Edge = { ...mockEdge, id: 'edge1', source: 'node1', target: 'node2' };
    const edge2: Edge = { ...mockEdge, id: 'edge2', source: 'node2', target: 'node3' };

    context.nodesMap.set('node1', node1);
    context.nodesMap.set('node2', node2);
    context.nodesMap.set('node3', node3);
    context.edgesMap.set('edge1', edge1);
    context.edgesMap.set('edge2', edge2);

    emitter.emit(context, eventManager);

    expect(emitSpy).toHaveBeenCalledTimes(2);
    expect(emitSpy).toHaveBeenCalledWith('edgeDrawn', {
      edge: edge1,
      source: node1,
      target: node2,
      sourcePort: undefined,
      targetPort: undefined,
    });
    expect(emitSpy).toHaveBeenCalledWith('edgeDrawn', {
      edge: edge2,
      source: node2,
      target: node3,
      sourcePort: undefined,
      targetPort: undefined,
    });
  });

  it('should not emit event for existing edges', () => {
    helpers.anyEdgesAdded.mockReturnValue(true);

    const sourceNode: Node = { ...mockNode, id: 'node1' };
    const targetNode: Node = { ...mockNode, id: 'node2' };
    const existingEdge: Edge = { ...mockEdge, id: 'existing', source: 'node1', target: 'node2' };
    const newEdge: Edge = { ...mockEdge, id: 'new', source: 'node1', target: 'node2' };

    context.nodesMap.set('node1', sourceNode);
    context.nodesMap.set('node2', targetNode);
    context.initialEdgesMap.set('existing', existingEdge);
    context.edgesMap.set('existing', existingEdge);
    context.edgesMap.set('new', newEdge);

    emitter.emit(context, eventManager);

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('edgeDrawn', {
      edge: newEdge,
      source: sourceNode,
      target: targetNode,
      sourcePort: undefined,
      targetPort: undefined,
    });
  });

  it('should not emit event when source node is missing', () => {
    helpers.anyEdgesAdded.mockReturnValue(true);

    const targetNode: Node = { ...mockNode, id: 'node2' };
    const edge: Edge = { ...mockEdge, id: 'edge1', source: 'node1', target: 'node2' };

    // Only add target node, not source node
    context.nodesMap.set('node2', targetNode);
    context.edgesMap.set('edge1', edge);

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should not emit event when target node is missing', () => {
    helpers.anyEdgesAdded.mockReturnValue(true);

    const sourceNode: Node = { ...mockNode, id: 'node1' };
    const edge: Edge = { ...mockEdge, id: 'edge1', source: 'node1', target: 'node2' };

    // Only add source node, not target node
    context.nodesMap.set('node1', sourceNode);
    context.edgesMap.set('edge1', edge);

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should not emit event when both source and target nodes are missing', () => {
    helpers.anyEdgesAdded.mockReturnValue(true);

    const edge: Edge = { ...mockEdge, id: 'edge1', source: 'node1', target: 'node2' };

    // Don't add any nodes
    context.edgesMap.set('edge1', edge);

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should handle edges with custom data', () => {
    helpers.anyEdgesAdded.mockReturnValue(true);

    const sourceNode: Node = { ...mockNode, id: 'node1', data: { label: 'Source' } };
    const targetNode: Node = { ...mockNode, id: 'node2', data: { label: 'Target' } };
    const edge: Edge = {
      ...mockEdge,
      id: 'edge1',
      source: 'node1',
      target: 'node2',
      data: { weight: 10, type: 'dataFlow' },
    };

    context.nodesMap.set('node1', sourceNode);
    context.nodesMap.set('node2', targetNode);
    context.edgesMap.set('edge1', edge);

    emitter.emit(context, eventManager);

    const expectedEvent: EdgeDrawnEvent = {
      edge,
      source: sourceNode,
      target: targetNode,
      sourcePort: undefined,
      targetPort: undefined,
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('edgeDrawn', expectedEvent);
  });
});
