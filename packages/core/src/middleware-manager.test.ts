import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MiddlewareManager } from './middleware-manager';
import type {
  FlowState,
  FlowStateDiff,
  Middleware,
  MiddlewareContext,
  ModelAction,
} from './types/middleware.interface';

describe('MiddlewareManager', () => {
  let middlewareManager: MiddlewareManager;
  let mockMiddleware1: Middleware;
  let mockMiddleware2: Middleware;
  let initialState: FlowState;
  let modelAction: ModelAction;
  let context: MiddlewareContext;

  beforeEach(() => {
    middlewareManager = new MiddlewareManager();

    mockMiddleware1 = vi.fn().mockImplementation(
      (stateDiff: FlowStateDiff): FlowStateDiff => ({
        ...stateDiff,
        nodes: {
          added: [{ id: 'node1', type: 'test', position: { x: 0, y: 0 } }],
        },
      })
    );

    mockMiddleware2 = vi.fn().mockImplementation(
      (stateDiff: FlowStateDiff): FlowStateDiff => ({
        ...stateDiff,
        nodes: {
          added: [...(stateDiff.nodes?.added ?? []), { id: 'node2', type: 'test', position: { x: 0, y: 0 } }],
        },
      })
    );

    initialState = {
      nodes: [],
      edges: [],
      metadata: {},
    };

    modelAction = { name: 'selectionChange', data: { id: 'node1', selected: true } };
    context = { modelAction, initialState };
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

      const result = middlewareManager.execute(initialState, modelAction);
      expect(result).toEqual({});
    });

    it('should handle unregistering a non-existent middleware gracefully', () => {
      expect(() => middlewareManager.unregister(mockMiddleware1)).not.toThrow();
    });
  });

  describe('execute', () => {
    it('should execute all registered middlewares in sequence', () => {
      middlewareManager.register(mockMiddleware1);
      middlewareManager.register(mockMiddleware2);

      const result = middlewareManager.execute(initialState, modelAction);

      expect(result.nodes?.added?.length).toBe(2);
      expect(result.nodes?.added?.[0].id).toBe('node1');
      expect(result.nodes?.added?.[1].id).toBe('node2');
      expect(mockMiddleware1).toHaveBeenCalledWith({}, context);
      expect(mockMiddleware2).toHaveBeenCalledWith(
        expect.objectContaining({ nodes: { added: [{ id: 'node1', type: 'test', position: { x: 0, y: 0 } }] } }),
        context
      );
    });

    it('should return empty state when no middlewares are registered', () => {
      const result = middlewareManager.execute(initialState, modelAction);

      expect(result).toEqual({});
    });
  });
});
