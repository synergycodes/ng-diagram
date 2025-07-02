import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../flow-core';
import { mockMetadata, mockNode } from '../test-utils';
import type {
  FlowState,
  FlowStateUpdate,
  Metadata,
  Middleware,
  MiddlewaresConfigFromMiddlewares,
  ModelAdapter,
} from '../types';
import { MiddlewareManager } from './middleware-manager';

// Define all mocks at the top level
vi.mock('./middlewares/edges-routing', () => ({
  edgesRoutingMiddleware: {
    name: 'edges-routing',
    execute: vi.fn().mockImplementation((state) => state),
  },
}));

const mockRun = vi.fn();
vi.mock('./middleware-executor', () => ({
  MiddlewareExecutor: vi.fn().mockImplementation(() => ({
    run: mockRun,
  })),
}));

type TestMiddlewares = [
  Middleware<'mockMiddleware1'>,
  Middleware<'mockMiddleware2'>,
  Middleware<'mockMiddlewareWithMetadata', { enabled: boolean; threshold: number }>,
];
type TestMetadata = Metadata<MiddlewaresConfigFromMiddlewares<TestMiddlewares>>;

describe('MiddlewareManager', () => {
  let flowCore: FlowCore<TestMiddlewares, TestMetadata>;
  let mockMiddleware1: Middleware<'mockMiddleware1'>;
  let mockMiddleware2: Middleware<'mockMiddleware2'>;
  let middlewareManager: MiddlewareManager<TestMiddlewares, TestMetadata>;
  let initialState: FlowState<TestMetadata>;
  let stateUpdate: FlowStateUpdate;
  let MiddlewareExecutor: unknown;
  let mockModel: ModelAdapter<TestMetadata>;

  beforeEach(async () => {
    const module = await import('./middleware-executor');
    MiddlewareExecutor = module.MiddlewareExecutor;

    const getMetadataMock = vi.fn().mockReturnValue({
      viewport: { x: 0, y: 0, scale: 1 },
      middlewaresConfig: {},
    });

    mockModel = {
      getMetadata: getMetadataMock,
      updateMiddlewareMetadata: vi.fn(),
      setMetadata: vi.fn(),
      getNodes: vi.fn(),
      getEdges: vi.fn(),
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      onChange: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
    } as unknown as ModelAdapter<TestMetadata>;

    flowCore = {
      getState: vi.fn().mockReturnValue({
        nodes: [],
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1 },
          middlewaresConfig: {},
        },
      }),
      setState: vi.fn(),
      setMetadata: vi.fn(),
      applyUpdate: vi.fn(),
      model: mockModel,
    } as unknown as FlowCore<TestMiddlewares, TestMetadata>;
    middlewareManager = new MiddlewareManager(flowCore);

    // Spy on the methods that are called during registration
    vi.spyOn(middlewareManager, 'applyMiddlewareConfig');

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
    } as unknown as FlowState<TestMetadata>;
    stateUpdate = {
      nodesToAdd: [mockNode],
    };
  });

  describe('constructor', () => {
    it('should register starting middlewares if they are provided', () => {
      const middlewareManager = new MiddlewareManager(flowCore, [mockMiddleware1] as unknown as TestMiddlewares);
      middlewareManager.execute(initialState, stateUpdate, 'init');

      expect(MiddlewareExecutor).toHaveBeenCalledWith(flowCore, [mockMiddleware1]);
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

    it('should not call updateMiddlewareMetadata when registering middleware without defaultMetadata', () => {
      middlewareManager.register(mockMiddleware1);

      expect(middlewareManager.applyMiddlewareConfig).not.toHaveBeenCalled();
    });
  });

  describe('unregister', () => {
    it('should unregister a middleware', () => {
      middlewareManager.register(mockMiddleware1);
      middlewareManager.unregister(mockMiddleware1.name);

      middlewareManager.execute(initialState, stateUpdate, 'changeSelection');
      expect(mockRun).toHaveBeenCalledWith(initialState, stateUpdate, 'changeSelection');
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

      expect(mockRun).toHaveBeenCalledWith(initialState, stateUpdate, 'changeSelection');
    });

    it('should return passed next state when no middlewares are registered', () => {
      middlewareManager.execute(initialState, stateUpdate, 'changeSelection');

      expect(mockRun).toHaveBeenCalledWith(initialState, stateUpdate, 'changeSelection');
    });
  });
});
