import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MiddlewareManager } from './middleware-manager';
import type { FlowState, Middleware, MiddlewareContext } from './types/middleware.interface';

describe('MiddlewareManager', () => {
  let middlewareManager: MiddlewareManager;
  let mockMiddleware1: Middleware;
  let mockMiddleware2: Middleware;
  let initialState: FlowState;
  let context: MiddlewareContext;

  beforeEach(() => {
    middlewareManager = new MiddlewareManager();

    mockMiddleware1 = vi.fn().mockImplementation((state) => ({
      ...state,
      nodes: [...state.nodes, { id: 'node1', type: 'test' }],
    }));

    mockMiddleware2 = vi.fn().mockImplementation((state) => ({
      ...state,
      nodes: [...state.nodes, { id: 'node2', type: 'test' }],
    }));

    initialState = {
      nodes: [],
      edges: [],
      metadata: {},
    };

    context = {
      action: 'test',
      modelAction: 'setNodes',
      previousState: initialState,
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
      middlewareManager.unregister(mockMiddleware1);

      const result = middlewareManager.execute(initialState, context);
      expect(result.nodes).toHaveLength(0);
    });

    it('should handle unregistering a non-existent middleware gracefully', () => {
      expect(() => middlewareManager.unregister(mockMiddleware1)).not.toThrow();
    });
  });

  describe('execute', () => {
    it('should execute all registered middlewares in sequence', () => {
      middlewareManager.register(mockMiddleware1);
      middlewareManager.register(mockMiddleware2);

      const result = middlewareManager.execute(initialState, context);

      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[0].id).toBe('node1');
      expect(result.nodes[1].id).toBe('node2');
      expect(mockMiddleware1).toHaveBeenCalledWith(initialState, context);
      expect(mockMiddleware2).toHaveBeenCalledWith(
        expect.objectContaining({ nodes: [{ id: 'node1', type: 'test' }] }),
        context
      );
    });

    it('should return initial state when no middlewares are registered', () => {
      const result = middlewareManager.execute(initialState, context);

      expect(result).toEqual(initialState);
    });

    it('should pass the transformed state from one middleware to the next', () => {
      const transformMiddleware1: Middleware = (state) => ({
        ...state,
        metadata: { ...state.metadata, step: 1 },
      });

      const transformMiddleware2: Middleware = (state) => ({
        ...state,
        metadata: { ...state.metadata, step: 2 },
      });

      middlewareManager.register(transformMiddleware1);
      middlewareManager.register(transformMiddleware2);

      const result = middlewareManager.execute(initialState, context);

      expect(result.metadata).toEqual({ step: 2 });
    });
  });
});
