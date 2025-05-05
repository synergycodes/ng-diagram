import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MiddlewareManager } from './middleware-manager';
import { mockedMetadata, mockedNode } from './test-utils';
import type { FlowState, Middleware, MiddlewareContext } from './types/middleware.interface';

describe('MiddlewareManager', () => {
  let middlewareManager: MiddlewareManager;
  let mockMiddleware1: Middleware;
  let mockMiddleware2: Middleware;
  let prevState: FlowState;
  let nextState: FlowState;
  let context: MiddlewareContext;

  beforeEach(() => {
    middlewareManager = new MiddlewareManager();

    mockMiddleware1 = {
      name: 'mockMiddleware1',
      execute: vi.fn().mockImplementation(
        (state: FlowState): FlowState => ({
          ...state,
          nodes: [...state.nodes, { ...mockedNode, id: 'node2' }],
        })
      ),
    };

    mockMiddleware2 = {
      name: 'mockMiddleware2',
      execute: vi.fn().mockImplementation(
        (state: FlowState): FlowState => ({
          ...state,
          nodes: [...state.nodes, { ...mockedNode, id: 'node3' }],
        })
      ),
    };

    prevState = {
      nodes: [],
      edges: [],
      metadata: mockedMetadata,
    };
    nextState = {
      nodes: [mockedNode],
      edges: [],
      metadata: mockedMetadata,
    };
    context = {
      initialState: prevState,
      modelActionType: 'changeSelection',
      historyUpdates: [{ name: 'changeSelection', prevState, nextState }],
    };
  });

  describe('register', () => {
    it('should register a middleware and return an unregister function', () => {
      const unregister = middlewareManager.register(mockMiddleware1);

      expect(unregister).toBeDefined();
      expect(typeof unregister).toBe('function');
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
      expect(mockMiddleware1.execute).toHaveBeenCalledWith(nextState, context);
      expect(mockMiddleware2.execute).toHaveBeenCalledWith(
        { ...nextState, nodes: [...nextState.nodes, { ...mockedNode, id: 'node2' }] },
        {
          ...context,
          historyUpdates: [
            ...context.historyUpdates,
            {
              name: mockMiddleware1.name,
              prevState: nextState,
              nextState: { ...nextState, nodes: [...nextState.nodes, { ...mockedNode, id: 'node2' }] },
            },
          ],
        }
      );
    });

    it('should return passed next state when no middlewares are registered', () => {
      const result = middlewareManager.execute(prevState, nextState, 'changeSelection');

      expect(result).toEqual(nextState);
    });
  });
});
