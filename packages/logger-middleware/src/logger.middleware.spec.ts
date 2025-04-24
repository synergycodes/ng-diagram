import type { FlowState, FlowStateDiff, ModelAction } from '@angularflow/core';
import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { createLoggerMiddleware } from './logger.middleware';

describe('LoggerMiddleware', () => {
  let consoleLogSpy: MockInstance;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
      // do nothing
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should log action and state by default', () => {
    const middleware = createLoggerMiddleware();
    const initialState: FlowState = {
      nodes: [],
      edges: [],
      metadata: {},
    };
    const stateDiff: FlowStateDiff = {
      nodes: {
        added: [
          {
            id: '1',
            type: 'default',
            position: { x: 0, y: 0 },
          },
        ],
      },
    };
    const modelAction: ModelAction = {
      name: 'selectionChange',
      data: { id: '1', selected: true },
    };

    middleware(stateDiff, { modelAction, initialState });

    expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    expect(consoleLogSpy).toHaveBeenCalledWith('[AngularFlow] Action:', {
      type: 'selectionChange',
      data: { id: '1', selected: true },
    });
    expect(consoleLogSpy).toHaveBeenCalledWith('[AngularFlow] State:', {
      before: initialState,
      after: stateDiff,
    });
  });

  it('should only log action when logState is false', () => {
    const middleware = createLoggerMiddleware({ logState: false });
    const initialState: FlowState = {
      nodes: [],
      edges: [],
      metadata: {},
    };
    const stateDiff: FlowStateDiff = {
      nodes: {
        added: [
          {
            id: '1',
            type: 'default',
            position: { x: 0, y: 0 },
          },
        ],
      },
    };
    const modelAction: ModelAction = {
      name: 'selectionChange',
      data: { id: '1', selected: true },
    };

    middleware(stateDiff, { modelAction, initialState });

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith('[AngularFlow] Action:', {
      type: 'selectionChange',
      data: { id: '1', selected: true },
    });
  });

  it('should only log state when logAction is false', () => {
    const middleware = createLoggerMiddleware({ logAction: false });
    const initialState: FlowState = {
      nodes: [],
      edges: [],
      metadata: {},
    };
    const stateDiff: FlowStateDiff = {
      nodes: {
        added: [
          {
            id: '1',
            type: 'default',
            position: { x: 0, y: 0 },
          },
        ],
      },
    };
    const modelAction: ModelAction = {
      name: 'selectionChange',
      data: { id: '1', selected: true },
    };

    middleware(stateDiff, { modelAction, initialState });

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith('[AngularFlow] State:', {
      before: initialState,
      after: stateDiff,
    });
  });

  it('should return the state diff unchanged', () => {
    const middleware = createLoggerMiddleware();
    const initialState: FlowState = {
      nodes: [],
      edges: [],
      metadata: {},
    };
    const stateDiff: FlowStateDiff = {
      nodes: {
        added: [
          {
            id: '1',
            type: 'default',
            position: { x: 0, y: 0 },
          },
        ],
      },
    };
    const modelAction: ModelAction = {
      name: 'selectionChange',
      data: { id: '1', selected: true },
    };

    const result = middleware(stateDiff, { modelAction, initialState });

    expect(result).toBe(stateDiff);
  });
});
