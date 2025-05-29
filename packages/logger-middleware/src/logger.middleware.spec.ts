import type { FlowState, MiddlewareContext } from '@angularflow/core';
import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { loggerMiddleware } from './logger.middleware';

describe('LoggerMiddleware', () => {
  let consoleLogSpy: MockInstance;
  let initialState: FlowState;
  let context: MiddlewareContext;

  beforeEach(() => {
    initialState = {
      nodes: [],
      edges: [],
      metadata: { viewport: { x: 0, y: 0, scale: 1 } },
    };
    context = {
      initialState,
      state: initialState,
      nodesMap: new Map(),
      edgesMap: new Map(),
      metadata: initialState.metadata,
      history: [{ name: 'init', stateUpdate: { nodesToAdd: [] } }],
      initialUpdate: { nodesToAdd: [] },
    } as unknown as MiddlewareContext;

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
      // do nothing
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should log all information and return the state', () => {
    const state: FlowState = {
      nodes: [
        { id: 'node1', type: 'input', position: { x: 0, y: 0 }, data: {} },
        { id: 'node2', type: 'output', position: { x: 0, y: 0 }, data: {} },
      ],
      edges: [{ id: 'edge1', source: 'node1', target: 'node2', data: {} }],
      metadata: { viewport: { x: 0, y: 0, scale: 1 } },
    };
    const newContext: MiddlewareContext = {
      ...context,
      modelActionType: 'changeSelection',
      state,
    };

    const result = loggerMiddleware.execute(
      newContext,
      () => Promise.resolve(newContext.state),
      () => null
    );

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[AngularFlow] changeSelection',
      expect.objectContaining({
        initialState,
        finalState: state,
        historyUpdates: context.history,
        initialUpdate: context.initialUpdate,
      })
    );
    expect(result).toEqual(state);
  });
});
