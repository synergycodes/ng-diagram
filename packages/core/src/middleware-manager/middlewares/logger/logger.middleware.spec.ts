import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { FlowState, Metadata, MiddlewareContext } from '../../../types';
import { loggerMiddleware, LoggerMiddlewareMetadata } from './logger';

describe('LoggerMiddleware', () => {
  let consoleLogSpy: MockInstance;
  let initialState: FlowState;
  let context: MiddlewareContext<[], Metadata<Record<string, unknown>>, LoggerMiddlewareMetadata>;
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
      history: [],
      initialUpdate: { nodesToAdd: [] },
      middlewareMetadata: { enabled: true },
    } as unknown as MiddlewareContext<[], Metadata<Record<string, unknown>>, LoggerMiddlewareMetadata>;

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
    const newContext = {
      ...context,
      modelActionType: 'changeSelection',
      state,
    } as unknown as MiddlewareContext<[], Metadata<Record<string, unknown>>, LoggerMiddlewareMetadata>;

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
