import type { FlowState, MiddlewareContext } from '@angularflow/core';
import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { loggerMiddleware, LoggerMiddlewareMetadata } from './logger.middleware';

describe('LoggerMiddleware', () => {
  let consoleLogSpy: MockInstance;
  let initialState: FlowState;
  let context: MiddlewareContext<LoggerMiddlewareMetadata>;
  const nextMock = vi.fn();

  beforeEach(() => {
    initialState = {
      nodes: [],
      edges: [],
      metadata: { viewport: { x: 0, y: 0, scale: 1 }, middlewaresConfig: {} },
    };
    context = {
      initialState,
      state: initialState,
      nodesMap: new Map(),
      edgesMap: new Map(),
      metadata: initialState.metadata,
      history: [{ name: 'init', stateUpdate: { nodesToAdd: [] } }],
      initialUpdate: { nodesToAdd: [] },
    } as unknown as MiddlewareContext<LoggerMiddlewareMetadata>;

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
      metadata: { viewport: { x: 0, y: 0, scale: 1 }, middlewaresConfig: {} },
    };
    const newContext: MiddlewareContext<LoggerMiddlewareMetadata> = {
      ...context,
      modelActionType: 'changeSelection',
      state,
    };

    loggerMiddleware.execute(newContext, nextMock, () => null);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[AngularFlow] changeSelection',
      expect.objectContaining({
        initialState,
        finalState: state,
        history: context.history,
        initialUpdate: context.initialUpdate,
      })
    );
    expect(nextMock).toHaveBeenCalled();
  });
});
