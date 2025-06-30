import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../flow-core';
import { mockMetadata, mockNode } from '../test-utils';
import type {
  CombinedMiddlewaresConfig,
  FlowState,
  FlowStateUpdate,
  Metadata,
  Middleware,
  ModelAdapter,
} from '../types';
import { MiddlewareManager } from './middleware-manager';
import { edgesRoutingMiddleware } from './middlewares/edges-routing/edges-routing.ts';
import { groupChildrenChangeExtent } from './middlewares/group-children-change-extent';
import { groupChildrenMoveExtent } from './middlewares/group-children-move-extent';
import { nodePositionSnapMiddleware } from './middlewares/node-position-snap';
import { nodeRotationSnapMiddleware } from './middlewares/node-rotation-snap';
import { treeLayoutMiddleware } from './middlewares/tree-layout/tree-layout.ts';

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
type TestMetadata = Metadata<CombinedMiddlewaresConfig<TestMiddlewares>>;

describe('MiddlewareManager', () => {
  let flowCore: FlowCore<TestMiddlewares, TestMetadata>;
  let mockMiddleware1: Middleware<'mockMiddleware1'>;
  let mockMiddleware2: Middleware<'mockMiddleware2'>;
  let mockMiddlewareWithMetadata: Middleware<'mockMiddlewareWithMetadata', { enabled: boolean; threshold: number }>;
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
    vi.spyOn(middlewareManager, 'removeMiddlewareConfig');

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

    mockMiddlewareWithMetadata = {
      name: 'mockMiddlewareWithMetadata',
      defaultMetadata: {
        enabled: true,
        threshold: 100,
      },
      execute: vi.fn().mockImplementation(
        (state: FlowState): FlowState => ({
          ...state,
          nodes: [...state.nodes, { ...mockNode, id: 'node4' }],
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
    it('should register edges routing middleware', () => {
      const middlewareManager = new MiddlewareManager(flowCore);

      middlewareManager.execute(initialState, stateUpdate, 'init');

      expect(MiddlewareExecutor).toHaveBeenCalledWith(flowCore, [
        nodeRotationSnapMiddleware,
        groupChildrenChangeExtent,
        groupChildrenMoveExtent,
        treeLayoutMiddleware,
        edgesRoutingMiddleware,
        nodePositionSnapMiddleware,
      ]);
    });

    it('should register starting middlewares if they are provided', () => {
      const middlewareManager = new MiddlewareManager(flowCore, [mockMiddleware1] as unknown as TestMiddlewares);
      middlewareManager.execute(initialState, stateUpdate, 'init');

      expect(MiddlewareExecutor).toHaveBeenCalledWith(flowCore, [
        nodeRotationSnapMiddleware,
        groupChildrenChangeExtent,
        groupChildrenMoveExtent,
        treeLayoutMiddleware,
        edgesRoutingMiddleware,
        nodePositionSnapMiddleware,
        mockMiddleware1,
      ]);
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

    it('should apply defaultMetadata when registering middleware with defaultMetadata', () => {
      middlewareManager.register(mockMiddlewareWithMetadata);

      expect(middlewareManager.applyMiddlewareConfig).toHaveBeenCalledWith('mockMiddlewareWithMetadata', {
        enabled: true,
        threshold: 100,
      });
    });

    it('should not call updateMiddlewareMetadata when registering middleware without defaultMetadata', () => {
      middlewareManager.register(mockMiddleware1);

      expect(middlewareManager.applyMiddlewareConfig).not.toHaveBeenCalled();
    });
  });

  describe('unregister', () => {
    it('should unregister a middleware', () => {
      middlewareManager.register(mockMiddleware1);
      middlewareManager.unregister(mockMiddleware1.name as keyof TestMetadata['middlewaresConfig']);

      middlewareManager.execute(initialState, stateUpdate, 'changeSelection');
      expect(mockRun).toHaveBeenCalledWith(initialState, stateUpdate, 'changeSelection');
    });

    it('should handle unregistering a non-existent middleware gracefully', () => {
      expect(() =>
        middlewareManager.unregister(mockMiddleware1.name as keyof TestMetadata['middlewaresConfig'])
      ).not.toThrow();
    });

    it('should remove middleware metadata when unregistering', () => {
      // Setup initial metadata with some middleware metadata
      const initialMetadata = {
        viewport: { x: 0, y: 0, scale: 1 },
        middlewaresConfig: {
          mockMiddlewareWithMetadata: { enabled: true, threshold: 100 },
          otherMiddleware: { someProp: 'value' },
        },
      };

      // Create a new mock for this specific test
      const testMockModel = {
        ...mockModel,
        getMetadata: vi.fn().mockReturnValue(initialMetadata),
      };

      const testFlowCore = {
        ...flowCore,
        getState: vi.fn().mockReturnValue({
          nodes: [],
          edges: [],
          metadata: initialMetadata,
        }),
        setState: vi.fn(),
        model: testMockModel,
      } as unknown as FlowCore<TestMiddlewares, TestMetadata>;

      const testMiddlewareManager = new MiddlewareManager(testFlowCore);

      // Spy on the methods for this specific test
      vi.spyOn(testMiddlewareManager, 'applyMiddlewareConfig');
      vi.spyOn(testMiddlewareManager, 'removeMiddlewareConfig');

      testMiddlewareManager.register(mockMiddlewareWithMetadata);
      testMiddlewareManager.unregister(mockMiddlewareWithMetadata.name as keyof TestMetadata['middlewaresConfig']);

      expect(testFlowCore.setState).toHaveBeenCalledWith({
        nodes: [],
        edges: [],
        metadata: {
          ...initialMetadata,
          middlewaresConfig: {
            ...initialMetadata.middlewaresConfig,
            otherMiddleware: { someProp: 'value' },
          },
        },
      });
    });

    it('should handle unregistering middleware that has no metadata gracefully', () => {
      middlewareManager.register(mockMiddleware1);

      expect(() =>
        middlewareManager.unregister(mockMiddleware1.name as keyof TestMetadata['middlewaresConfig'])
      ).not.toThrow();
      expect(flowCore.setState).toHaveBeenCalled();
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
