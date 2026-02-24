import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionStateManager } from '../../../../../action-state-manager/action-state-manager';
import type { EventManager } from '../../../../../event-manager/event-manager';
import { mockEdge, mockNode } from '../../../../../test-utils';
import type { Edge, MiddlewareContext, Node } from '../../../../../types';
import { SelectionGestureEndedEmitter } from '../selection-gesture-ended.emitter';

function createContext(overrides: Partial<MiddlewareContext> = {}): MiddlewareContext {
  return {
    modelActionType: 'selectEnd',
    modelActionTypes: ['selectEnd'],
    nodesMap: new Map<string, Node>(),
    edgesMap: new Map<string, Edge>(),
    actionStateManager: {
      selection: undefined,
      clearSelection: vi.fn(),
    } as unknown as ActionStateManager,
    ...overrides,
  } as unknown as MiddlewareContext;
}

describe('SelectionGestureEndedEmitter', () => {
  let emitter: SelectionGestureEndedEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    emitter = new SelectionGestureEndedEmitter();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: emitSpy,
    } as unknown as EventManager;
  });

  it('should not emit event when modelActionTypes does not include selectEnd', () => {
    const context = createContext({ modelActionTypes: ['changeSelection'] });
    const node: Node = { ...mockNode, id: 'node1', selected: true };
    context.nodesMap.set('node1', node);

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should not emit when selectEnd fires without selection having changed', () => {
    const context = createContext();
    const node: Node = { ...mockNode, id: 'node1', selected: true };
    context.nodesMap.set('node1', node);

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should emit when selection changed before selectEnd', () => {
    const node1: Node = { ...mockNode, id: 'node1', selected: true };
    const edge1: Edge = { ...mockEdge, id: 'edge1', selected: true };

    const context = createContext({
      actionStateManager: {
        selection: { selectionChanged: true },
        clearSelection: vi.fn(),
      } as unknown as ActionStateManager,
    });
    context.nodesMap.set('node1', node1);
    context.edgesMap.set('edge1', edge1);

    emitter.emit(context, eventManager);

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionGestureEnded', {
      nodes: [node1],
      edges: [edge1],
    });
  });

  it('should clear selection action state after emission', () => {
    const clearSpy = vi.fn();
    const context = createContext({
      actionStateManager: {
        selection: { selectionChanged: true },
        clearSelection: clearSpy,
      } as unknown as ActionStateManager,
    });

    emitter.emit(context, eventManager);

    expect(clearSpy).toHaveBeenCalledOnce();
  });

  it('should emit with empty arrays when nothing is selected after selection changed', () => {
    const context = createContext({
      actionStateManager: {
        selection: { selectionChanged: true },
        clearSelection: vi.fn(),
      } as unknown as ActionStateManager,
    });
    const node1: Node = { ...mockNode, id: 'node1', selected: false };
    const edge1: Edge = { ...mockEdge, id: 'edge1', selected: false };
    context.nodesMap.set('node1', node1);
    context.edgesMap.set('edge1', edge1);

    emitter.emit(context, eventManager);

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionGestureEnded', {
      nodes: [],
      edges: [],
    });
  });

  it('should emit with multiple selected nodes and edges', () => {
    const node1: Node = { ...mockNode, id: 'node1', selected: true };
    const node2: Node = { ...mockNode, id: 'node2', selected: true };
    const edge1: Edge = { ...mockEdge, id: 'edge1', selected: true };
    const edge2: Edge = { ...mockEdge, id: 'edge2', selected: true };

    const context = createContext({
      actionStateManager: {
        selection: { selectionChanged: true },
        clearSelection: vi.fn(),
      } as unknown as ActionStateManager,
    });
    context.nodesMap.set('node1', node1);
    context.nodesMap.set('node2', node2);
    context.edgesMap.set('edge1', edge1);
    context.edgesMap.set('edge2', edge2);

    emitter.emit(context, eventManager);

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionGestureEnded', {
      nodes: [node1, node2],
      edges: [edge1, edge2],
    });
  });
});
