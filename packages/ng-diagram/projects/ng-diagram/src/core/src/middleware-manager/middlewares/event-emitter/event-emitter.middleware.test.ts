/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../event-manager/event-manager';
import type { MiddlewareContext } from '../../../types';
import { createEventEmitterMiddleware } from './event-emitter.middleware';

describe('EventEmitterMiddleware', () => {
  let eventManager: EventManager;
  let context: MiddlewareContext;
  let nextMock: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    eventManager = {
      isEnabled: vi.fn().mockReturnValue(true),
      emit: vi.fn(),
      deferredEmit: vi.fn(),
      flushDeferredEmits: vi.fn(),
      clearDeferredEmits: vi.fn(),
      on: vi.fn(),
      once: vi.fn(),
      off: vi.fn(),
      offAll: vi.fn(),
      setEnabled: vi.fn(),
      hasListeners: vi.fn(),
    } as unknown as EventManager;

    context = {
      modelActionType: 'init',
      modelActionTypes: ['init'],
      initialState: {
        nodes: [],
        edges: [],
        metadata: { viewport: { x: 0, y: 0, scale: 1 } },
      },
      state: {
        nodes: [],
        edges: [],
        metadata: { viewport: { x: 0, y: 0, scale: 1 } },
      },
      nodesMap: new Map(),
      edgesMap: new Map(),
      initialNodesMap: new Map(),
      initialEdgesMap: new Map(),
      initialUpdate: {},
      history: [],
      helpers: {
        anyEdgesAdded: vi.fn().mockReturnValue(false),
        checkIfAnyNodePropsChanged: vi.fn().mockReturnValue(false),
        checkIfAnyEdgePropsChanged: vi.fn().mockReturnValue(false),
        getAffectedNodeIds: vi.fn().mockReturnValue([]),
        getAffectedEdgeIds: vi.fn().mockReturnValue([]),
      },
    } as unknown as MiddlewareContext;

    nextMock = vi.fn();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should call next before processing emitters', () => {
    const middleware = createEventEmitterMiddleware(eventManager);
    const callOrder: string[] = [];

    nextMock.mockImplementation(() => {
      callOrder.push('next');
    });

    (eventManager.deferredEmit as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('deferredEmit');
    });

    middleware.execute(context, nextMock, vi.fn());

    expect(nextMock).toHaveBeenCalled();
    expect(callOrder[0]).toBe('next');
  });

  it('should not process emitters when event manager is disabled', () => {
    (eventManager.isEnabled as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const middleware = createEventEmitterMiddleware(eventManager);
    middleware.execute(context, nextMock, vi.fn());

    expect(nextMock).toHaveBeenCalled();
    expect(eventManager.deferredEmit).not.toHaveBeenCalled();
  });

  it('should process all emitters when event manager is enabled', () => {
    const middleware = createEventEmitterMiddleware(eventManager);

    // Set up context for init event (empty diagram should emit immediately)
    context.modelActionTypes = ['init'];

    middleware.execute(context, nextMock, vi.fn());

    expect(nextMock).toHaveBeenCalled();
    // DiagramInitEmitter should emit for empty diagram
    expect(eventManager.deferredEmit).toHaveBeenCalled();
  });

  it('should handle viewport change events', () => {
    const middleware = createEventEmitterMiddleware(eventManager);

    context.modelActionTypes = ['moveViewport'];
    context.initialState.metadata.viewport = { x: 0, y: 0, scale: 1, width: 800, height: 600 };
    context.state.metadata.viewport = { x: 100, y: 100, scale: 2, width: 800, height: 600 };

    middleware.execute(context, nextMock, vi.fn());

    expect(eventManager.deferredEmit).toHaveBeenCalledWith('viewportChanged', {
      viewport: context.state.metadata.viewport,
      previousViewport: context.initialState.metadata.viewport,
    });
  });

  it('should handle selection change events', () => {
    const middleware = createEventEmitterMiddleware(eventManager);

    context.modelActionTypes = ['changeSelection'];

    const node1 = { id: 'node1', selected: false, position: { x: 0, y: 0 }, data: {} };
    const node2 = { id: 'node2', selected: true, position: { x: 0, y: 0 }, data: {} };

    context.initialNodesMap.set('node1', node1);
    context.nodesMap.set('node1', node1);
    context.nodesMap.set('node2', node2);

    middleware.execute(context, nextMock, vi.fn());

    expect(eventManager.deferredEmit).toHaveBeenCalledWith('selectionChanged', {
      selectedNodes: [node2],
      selectedEdges: [],
      previousNodes: [],
      previousEdges: [],
    });
  });

  it('should handle node movement events', () => {
    const middleware = createEventEmitterMiddleware(eventManager);

    context.modelActionTypes = ['moveNodes'];

    const initialNode = { id: 'node1', position: { x: 0, y: 0 }, data: {} };
    const movedNode = { id: 'node1', position: { x: 100, y: 100 }, data: {} };

    context.initialNodesMap.set('node1', initialNode);
    context.nodesMap.set('node1', movedNode);
    context.initialUpdate = {
      nodesToUpdate: [{ id: 'node1', position: { x: 100, y: 100 } }],
    };

    middleware.execute(context, nextMock, vi.fn());

    expect(eventManager.deferredEmit).toHaveBeenCalledWith('selectionMoved', {
      nodes: [movedNode],
    });
  });

  it('should handle edge drawn events', () => {
    const middleware = createEventEmitterMiddleware(eventManager);

    context.modelActionTypes = ['finishLinking'];

    const sourceNode = { id: 'node1', position: { x: 0, y: 0 }, data: {} };
    const targetNode = { id: 'node2', position: { x: 100, y: 100 }, data: {} };
    const edge = { id: 'edge1', source: 'node1', target: 'node2', data: {} };

    context.nodesMap.set('node1', sourceNode);
    context.nodesMap.set('node2', targetNode);
    context.edgesMap.set('edge1', edge);
    context.helpers.anyEdgesAdded = vi.fn().mockReturnValue(true);

    middleware.execute(context, nextMock, vi.fn());

    expect(eventManager.deferredEmit).toHaveBeenCalledWith('edgeDrawn', {
      edge,
      source: sourceNode,
      target: targetNode,
      sourcePort: undefined,
      targetPort: undefined,
    });
  });

  it('should handle errors in emitters gracefully', () => {
    const middleware = createEventEmitterMiddleware(eventManager);

    // Mock an emitter to throw an error
    context.modelActionTypes = ['changeSelection'];

    // Force an error by making the context invalid for SelectionChangedEmitter
    context.nodesMap = null as any;

    middleware.execute(context, nextMock, vi.fn());

    expect(nextMock).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ngDiagram] Event emitter error:');
  });

  it('should process multiple emitters even if one fails', () => {
    const middleware = createEventEmitterMiddleware(eventManager);

    // Set up for viewport change (should work)
    context.modelActionTypes = ['changeSelection'];
    context.initialState.metadata.viewport = { x: 0, y: 0, scale: 1, width: 800, height: 600 };
    context.state.metadata.viewport = { x: 100, y: 100, scale: 1, width: 800, height: 600 };

    // Break the nodesMap iterator to cause an error in SelectionChangedEmitter
    Object.defineProperty(context.nodesMap, Symbol.iterator, {
      value: () => {
        throw new Error('Iterator error');
      },
    });

    middleware.execute(context, nextMock, vi.fn());

    // Should still emit viewport change even if selection change emitter fails
    expect(eventManager.deferredEmit).toHaveBeenCalledWith('viewportChanged', expect.any(Object));
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should not emit events when conditions are not met', () => {
    const middleware = createEventEmitterMiddleware(eventManager);

    // Set up context where no events should be emitted
    context.modelActionTypes = ['updateNode'];
    context.initialState.metadata.viewport = { x: 0, y: 0, scale: 1, width: 800, height: 600 };
    context.state.metadata.viewport = { x: 0, y: 0, scale: 1, width: 800, height: 600 }; // No change

    middleware.execute(context, nextMock, vi.fn());

    expect(nextMock).toHaveBeenCalled();
    // No events should be emitted for unchanged viewport
    expect(eventManager.deferredEmit).not.toHaveBeenCalledWith('viewportChanged', expect.any(Object));
  });

  it('should create independent middleware instances', () => {
    const eventManager1 = {
      ...eventManager,
      deferredEmit: vi.fn(),
    } as unknown as EventManager;

    const eventManager2 = {
      ...eventManager,
      deferredEmit: vi.fn(),
    } as unknown as EventManager;

    const middleware1 = createEventEmitterMiddleware(eventManager1);
    const middleware2 = createEventEmitterMiddleware(eventManager2);

    context.modelActionTypes = ['init'];

    middleware1.execute(context, nextMock, vi.fn());
    middleware2.execute(context, nextMock, vi.fn());

    expect(eventManager1.deferredEmit).toHaveBeenCalled();
    expect(eventManager2.deferredEmit).toHaveBeenCalled();
    expect(eventManager1.deferredEmit).not.toBe(eventManager2.deferredEmit);
  });

  it('should handle complex state transitions', () => {
    const middleware = createEventEmitterMiddleware(eventManager);

    // Simulate a complex operation with multiple changes
    context.modelActionTypes = ['changeSelection'];

    const node1 = { id: 'node1', selected: true, position: { x: 0, y: 0 }, data: {} };
    const node2 = { id: 'node2', selected: false, position: { x: 100, y: 100 }, data: {} };
    const edge1 = { id: 'edge1', selected: true, source: 'node1', target: 'node2', data: {} };

    context.initialNodesMap.set('node1', { ...node1, selected: false });
    context.initialNodesMap.set('node2', { ...node2, selected: true });
    context.initialEdgesMap.set('edge1', { ...edge1, selected: false });

    context.nodesMap.set('node1', node1);
    context.nodesMap.set('node2', node2);
    context.edgesMap.set('edge1', edge1);

    // Also change viewport
    context.initialState.metadata.viewport = { x: 0, y: 0, scale: 1, width: 800, height: 600 };
    context.state.metadata.viewport = { x: 50, y: 50, scale: 1.5, width: 800, height: 600 };

    middleware.execute(context, nextMock, vi.fn());

    // Should emit both selection change and viewport change
    expect(eventManager.deferredEmit).toHaveBeenCalledWith('selectionChanged', expect.any(Object));
    expect(eventManager.deferredEmit).toHaveBeenCalledWith('viewportChanged', expect.any(Object));
  });
});
