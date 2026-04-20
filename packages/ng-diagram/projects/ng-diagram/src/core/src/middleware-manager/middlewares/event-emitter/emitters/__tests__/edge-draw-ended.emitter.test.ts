import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../../../event-manager/event-manager';
import { mockEdge, mockNode } from '../../../../../test-utils';
import type { Edge, LinkingActionState, MiddlewareContext, Node } from '../../../../../types';
import { EdgeDrawEndedEmitter } from '../edge-draw-ended.emitter';

describe('EdgeDrawEndedEmitter', () => {
  let emitter: EdgeDrawEndedEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let helpers: { anyEdgesAdded: ReturnType<typeof vi.fn> };
  let mockActionStateManager: { linking: LinkingActionState | undefined };
  let context: MiddlewareContext;

  const sourceNode: Node = { ...mockNode, id: 'source-node' };
  const targetNode: Node = { ...mockNode, id: 'target-node' };
  const dropPosition = { x: 100, y: 200 };

  const baseLinking: LinkingActionState = {
    sourceNodeId: 'source-node',
    sourcePortId: 'port-1',
    temporaryEdge: null,
    dropPosition,
  };

  beforeEach(() => {
    emitter = new EdgeDrawEndedEmitter();
    emitSpy = vi.fn();
    eventManager = { deferredEmit: emitSpy } as unknown as EventManager;

    helpers = { anyEdgesAdded: vi.fn() };
    mockActionStateManager = { linking: { ...baseLinking } };

    context = {
      modelActionTypes: ['finishLinking'],
      helpers: helpers as unknown as MiddlewareContext['helpers'],
      initialEdgesMap: new Map<string, Edge>(),
      edgesMap: new Map<string, Edge>(),
      nodesMap: new Map<string, Node>(),
      actionStateManager: mockActionStateManager,
    } as unknown as MiddlewareContext;

    context.nodesMap.set('source-node', sourceNode);
    context.nodesMap.set('target-node', targetNode);
  });

  it('should not emit when action type is not finishLinking', () => {
    context.modelActionTypes = ['addEdges'];

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should not emit when linking state is null', () => {
    mockActionStateManager.linking = undefined;

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should not emit when source node is missing from nodesMap', () => {
    context.nodesMap.delete('source-node');

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should emit success event when edge was added', () => {
    helpers.anyEdgesAdded.mockReturnValue(true);

    const edge: Edge = {
      ...mockEdge,
      id: 'new-edge',
      source: 'source-node',
      target: 'target-node',
      sourcePort: 'port-1',
      targetPort: 'port-2',
    };
    context.edgesMap.set('new-edge', edge);

    emitter.emit(context, eventManager);

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('edgeDrawEnded', {
      source: sourceNode,
      sourcePort: 'port-1',
      dropPosition,
      success: true,
      edge,
      target: targetNode,
      targetPort: 'port-2',
    });
  });

  it('should emit success event with undefined target for floating edge', () => {
    helpers.anyEdgesAdded.mockReturnValue(true);

    const floatingEdge: Edge = {
      ...mockEdge,
      id: 'floating-edge',
      source: 'source-node',
      target: '',
      sourcePort: 'port-1',
      targetPort: '',
    };
    context.edgesMap.set('floating-edge', floatingEdge);

    emitter.emit(context, eventManager);

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('edgeDrawEnded', {
      source: sourceNode,
      sourcePort: 'port-1',
      dropPosition,
      success: true,
      edge: floatingEdge,
      target: undefined,
      targetPort: '',
    });
  });

  it('should skip existing edges and only emit for newly added edge', () => {
    helpers.anyEdgesAdded.mockReturnValue(true);

    const existingEdge: Edge = { ...mockEdge, id: 'existing', source: 'source-node', target: 'target-node' };
    const newEdge: Edge = { ...mockEdge, id: 'new-edge', source: 'source-node', target: 'target-node' };

    context.initialEdgesMap.set('existing', existingEdge);
    context.edgesMap.set('existing', existingEdge);
    context.edgesMap.set('new-edge', newEdge);

    emitter.emit(context, eventManager);

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy.mock.calls[0][1].edge).toBe(newEdge);
  });

  it('should emit cancel event with noTarget reason', () => {
    helpers.anyEdgesAdded.mockReturnValue(false);
    mockActionStateManager.linking = {
      ...baseLinking,
      cancelReason: 'noTarget',
    };

    emitter.emit(context, eventManager);

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('edgeDrawEnded', {
      source: sourceNode,
      sourcePort: 'port-1',
      dropPosition,
      success: false,
      reason: 'noTarget',
    });
  });

  it('should emit cancel event with invalidConnection reason', () => {
    helpers.anyEdgesAdded.mockReturnValue(false);
    mockActionStateManager.linking = {
      ...baseLinking,
      cancelReason: 'invalidConnection',
    };

    emitter.emit(context, eventManager);

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('edgeDrawEnded', {
      source: sourceNode,
      sourcePort: 'port-1',
      dropPosition,
      success: false,
      reason: 'invalidConnection',
    });
  });

  it('should emit cancel event with invalidTarget reason', () => {
    helpers.anyEdgesAdded.mockReturnValue(false);
    mockActionStateManager.linking = {
      ...baseLinking,
      cancelReason: 'invalidTarget',
    };

    emitter.emit(context, eventManager);

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('edgeDrawEnded', {
      source: sourceNode,
      sourcePort: 'port-1',
      dropPosition,
      success: false,
      reason: 'invalidTarget',
    });
  });

  it('should default dropPosition to {x: 0, y: 0} when not set', () => {
    helpers.anyEdgesAdded.mockReturnValue(false);
    mockActionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'port-1',
      temporaryEdge: null,
      cancelReason: 'noTarget',
    };

    emitter.emit(context, eventManager);

    expect(emitSpy.mock.calls[0][1].dropPosition).toEqual({ x: 0, y: 0 });
  });

  it('should emit undefined sourcePort when sourcePortId is empty', () => {
    helpers.anyEdgesAdded.mockReturnValue(false);
    mockActionStateManager.linking = {
      ...baseLinking,
      sourcePortId: '',
      cancelReason: 'noTarget',
    };

    emitter.emit(context, eventManager);

    expect(emitSpy.mock.calls[0][1].sourcePort).toBeUndefined();
  });
});
