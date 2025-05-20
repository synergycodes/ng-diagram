import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../flow-core';
import { mockMetadata, mockNode } from '../test-utils';
import type { FlowState, Middleware, MiddlewareContext } from '../types';
import { MiddlewareManager } from './middleware-manager';
import { edgesStraightRoutingMiddleware } from './middlewares/edges-straight-routing';

vi.mock('./middlewares/edges-straight-routing', () => ({
  edgesStraightRoutingMiddleware: {
    name: 'edges-straight-routing',
    execute: vi.fn().mockImplementation((state) => state),
  },
}));

describe('MiddlewareManager', () => {
  let flowCore: FlowCore;
  let middlewareManager: MiddlewareManager;
  let mockMiddleware1: Middleware;
  let mockMiddleware2: Middleware;
  let prevState: FlowState;
  let nextState: FlowState;
  let context: MiddlewareContext;

  beforeEach(() => {
    flowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
    } as unknown as FlowCore;
    middlewareManager = new MiddlewareManager(flowCore);

    mockMiddleware1 = {
      name: 'mockMiddleware1',
      execute: vi.fn().mockImplementation(
        (state: FlowState): FlowState => ({
          ...state,
          nodes: [...state.nodes, { ...mockNode, id: 'node2' }],
        })
      ),
    };

    mockMiddleware2 = {
      name: 'mockMiddleware2',
      execute: vi.fn().mockImplementation(
        (state: FlowState): FlowState => ({
          ...state,
          nodes: [...state.nodes, { ...mockNode, id: 'node3' }],
        })
      ),
    };

    prevState = {
      nodes: [],
      edges: [],
      metadata: mockMetadata,
    };
    nextState = {
      nodes: [mockNode],
      edges: [],
      metadata: mockMetadata,
    };
    context = {
      initialState: prevState,
      modelActionType: 'changeSelection',
      historyUpdates: [{ name: 'changeSelection', prevState, nextState }],
    };
  });

  describe('constructor', () => {
    it('should register edges straight routing middleware', () => {
      const middlewareManager = new MiddlewareManager(flowCore);
      middlewareManager.execute(prevState, nextState, 'init');

      expect(edgesStraightRoutingMiddleware.execute).toHaveBeenCalled();
    });

    it('should register starting middlewares if they are provided', () => {
      const spy = vi.spyOn(mockMiddleware1, 'execute');

      const middlewareManager = new MiddlewareManager(flowCore, [mockMiddleware1]);
      middlewareManager.execute(prevState, nextState, 'init');

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register a middleware and return an unregister function', () => {
      const unregister = middlewareManager.register(mockMiddleware1);

      expect(unregister).toBeDefined();
      expect(typeof unregister).toBe('function');
    });

    it('should throw an error if the middleware is already registered', () => {
      middlewareManager.register(mockMiddleware1);

      expect(() => middlewareManager.register(mockMiddleware1)).toThrow();
    });
  });

  describe('unregister', () => {
    it('should unregister a middleware', () => {
      middlewareManager.register(mockMiddleware1);
      middlewareManager.unregister(mockMiddleware1.name);

      const result = middlewareManager.execute(prevState, nextState, 'changeSelection');
      expect(result).toEqual(nextState);
    });

    it('should handle unregistering a non-existent middleware gracefully', () => {
      expect(() => middlewareManager.unregister(mockMiddleware1.name)).not.toThrow();
    });
  });

  describe('execute', () => {
    it('should execute all registered middlewares in sequence', () => {
      middlewareManager.register(mockMiddleware1);
      middlewareManager.register(mockMiddleware2);

      const result = middlewareManager.execute(prevState, nextState, 'changeSelection');

      expect(result.nodes.length).toBe(3);
      expect(result.nodes[0].id).toBe('node1');
      expect(result.nodes[1].id).toBe('node2');
      expect(result.nodes[2].id).toBe('node3');
      expect(mockMiddleware1.execute).toHaveBeenCalledWith(nextState, context, flowCore);
      expect(mockMiddleware2.execute).toHaveBeenCalledWith(
        { ...nextState, nodes: [...nextState.nodes, { ...mockNode, id: 'node2' }] },
        {
          ...context,
          historyUpdates: [
            ...context.historyUpdates,
            {
              name: mockMiddleware1.name,
              prevState: nextState,
              nextState: { ...nextState, nodes: [...nextState.nodes, { ...mockNode, id: 'node2' }] },
            },
          ],
        },
        flowCore
      );
    });

    it('should return passed next state when no middlewares are registered', () => {
      const result = middlewareManager.execute(prevState, nextState, 'changeSelection');

      expect(result).toEqual(nextState);
    });
  });
});
