import type { FlowState } from '@angularflow/core';
import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { loggerMiddleware } from './logger.middleware';

describe('LoggerMiddleware', () => {
  let consoleLogSpy: MockInstance;
  let initialState: FlowState;

  beforeEach(() => {
    initialState = {
      nodes: [],
      edges: [],
      metadata: {},
    };

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
      metadata: {},
    };

    const result = loggerMiddleware.execute(state, {
      modelActionType: 'selectionChange',
      historyUpdates: [
        {
          name: 'selectionChange',
          prevState: initialState,
          nextState: state,
        },
      ],
      initialState,
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[AngularFlow] selectionChange',
      expect.objectContaining({
        initialState,
        finalState: state,
        historyUpdates: [{ name: 'selectionChange', prevState: initialState, nextState: state }],
      })
    );
    expect(result).toEqual(state);
  });
});
