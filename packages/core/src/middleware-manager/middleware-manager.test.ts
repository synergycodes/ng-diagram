import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../flow-core';
import { mockMetadata, mockNode } from '../test-utils';
import type { FlowState, FlowStateUpdate, Middleware } from '../types';
import { MiddlewareManager } from './middleware-manager';
import { edgesStraightRoutingMiddleware } from './middlewares/edges-straight-routing';

vi.mock('./middlewares/edges-straight-routing', () => ({
  edgesStraightRoutingMiddleware: {
    name: 'edges-straight-routing',
    execute: vi.fn().mockImplementation((state) => state),
  },
}));

const mockMiddlewareExecutor = {
  run: vi.fn(),
};

const MockMiddlewareExecutor = vi.fn().mockImplementation(() => mockMiddlewareExecutor);

vi.mock('./middleware-executor', () => ({
  MiddlewareExecutor: MockMiddlewareExecutor,
}));

describe('MiddlewareManager', () => {
  let flowCore: FlowCore;
  let middlewareManager: MiddlewareManager;
  let mockMiddleware1: Middleware;
  let mockMiddleware2: Middleware;
  let initialState: FlowState;
  let stateUpdate: FlowStateUpdate;

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

    initialState = {
      nodes: [],
      edges: [],
      metadata: mockMetadata,
    };
    stateUpdate = {
      nodesToAdd: [mockNode],
    };
  });

  describe('constructor', () => {
    it('should register edges straight routing middleware', () => {
      const middlewareManager = new MiddlewareManager(flowCore);

      middlewareManager.execute(initialState, stateUpdate, 'init');

      expect(mockMiddlewareExecutor.run).toHaveBeenCalledWith(initialState, stateUpdate, 'init');
      expect(MockMiddlewareExecutor).toHaveBeenCalledWith(flowCore, [edgesStraightRoutingMiddleware]);
    });

    it('should register starting middlewares if they are provided', () => {
      const middlewareManager = new MiddlewareManager(flowCore, [mockMiddleware1]);
      middlewareManager.execute(initialState, stateUpdate, 'init');

      expect(mockMiddlewareExecutor.run).toHaveBeenCalledWith(initialState, stateUpdate, 'init');
      expect(MockMiddlewareExecutor).toHaveBeenCalledWith(flowCore, [edgesStraightRoutingMiddleware, mockMiddleware1]);
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

      middlewareManager.execute(initialState, stateUpdate, 'changeSelection');
      expect(mockMiddlewareExecutor.run).toHaveBeenCalledWith(initialState, stateUpdate, 'changeSelection');
    });

    it('should handle unregistering a non-existent middleware gracefully', () => {
      expect(() => middlewareManager.unregister(mockMiddleware1.name)).not.toThrow();
    });
  });

  describe('execute', () => {
    it('should execute all registered middlewares in sequence', () => {
      middlewareManager.register(mockMiddleware1);
      middlewareManager.register(mockMiddleware2);

      middlewareManager.execute(initialState, stateUpdate, 'changeSelection');

      expect(mockMiddlewareExecutor.run).toHaveBeenCalledWith(initialState, stateUpdate, 'changeSelection');
    });

    it('should return passed next state when no middlewares are registered', () => {
      middlewareManager.execute(initialState, stateUpdate, 'changeSelection');

      expect(mockMiddlewareExecutor.run).toHaveBeenCalledWith(initialState, stateUpdate, 'changeSelection');
    });
  });
});
