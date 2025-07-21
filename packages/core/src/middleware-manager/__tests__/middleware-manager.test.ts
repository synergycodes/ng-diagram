import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../flow-core';
import { mockMetadata, mockNode } from '../../test-utils';
import type {
  FlowState,
  FlowStateUpdate,
  Metadata,
  Middleware,
  MiddlewaresConfigFromMiddlewares,
  ModelAdapter,
} from '../../types';
import { MiddlewareManager } from '../middleware-manager';

// Define all mocks at the top level
vi.mock('../middlewares/edges-routing', () => ({
  edgesRoutingMiddleware: {
    name: 'edges-routing',
    execute: vi.fn().mockImplementation((state) => state),
  },
}));

const mockRun = vi.fn();
vi.mock('../middleware-executor', () => ({
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
    const module = await import('../middleware-executor');
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

    it('should call applyMiddlewareConfig when registering middleware with defaultMetadata', () => {
      const middlewareWithMetadata = {
        name: 'mockMiddlewareWithMetadata',
        defaultMetadata: { enabled: true, threshold: 10 },
        execute: vi.fn(),
      };

      middlewareManager.register(middlewareWithMetadata);

      expect(middlewareManager.applyMiddlewareConfig).toHaveBeenCalledWith('mockMiddlewareWithMetadata', {
        enabled: true,
        threshold: 10,
      });
    });

    it('should return a function that unregisters the middleware when called', () => {
      const unregister = middlewareManager.register(mockMiddleware1);

      // Verify middleware is registered
      expect(middlewareManager['middlewareChain']).toContain(mockMiddleware1);

      // Call the unregister function
      unregister();

      // Verify middleware is no longer registered
      expect(middlewareManager['middlewareChain']).not.toContain(mockMiddleware1);
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

    it('should call applyMiddlewareConfig with undefined when unregistering middleware', () => {
      middlewareManager.register(mockMiddleware1);
      middlewareManager.unregister(mockMiddleware1.name);

      expect(middlewareManager.applyMiddlewareConfig).toHaveBeenCalledWith(mockMiddleware1.name, undefined);
    });

    it('should remove middleware from the chain when unregistered', () => {
      middlewareManager.register(mockMiddleware1);
      middlewareManager.register(mockMiddleware2);

      expect(middlewareManager['middlewareChain']).toContain(mockMiddleware1);
      expect(middlewareManager['middlewareChain']).toContain(mockMiddleware2);

      middlewareManager.unregister(mockMiddleware1.name);

      expect(middlewareManager['middlewareChain']).not.toContain(mockMiddleware1);
      expect(middlewareManager['middlewareChain']).toContain(mockMiddleware2);
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

  describe('applyMiddlewareConfig', () => {
    it('should update middleware configuration in the flow state', () => {
      const config = { enabled: true, threshold: 5 };

      middlewareManager.applyMiddlewareConfig('mockMiddlewareWithMetadata', config);

      expect(flowCore.setState).toHaveBeenCalled();
      const callArgs = (flowCore.setState as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs.metadata.middlewaresConfig.mockMiddlewareWithMetadata).toEqual(config);
    });

    it('should remove middleware configuration when config is undefined', () => {
      // First set a config
      const initialConfig = { enabled: true, threshold: 5 };
      middlewareManager.applyMiddlewareConfig('mockMiddlewareWithMetadata', initialConfig);

      // Reset the mock to clear previous calls
      (flowCore.setState as ReturnType<typeof vi.fn>).mockClear();

      // Now remove the config
      middlewareManager.applyMiddlewareConfig('mockMiddlewareWithMetadata', undefined);

      expect(flowCore.setState).toHaveBeenCalled();
      const callArgs = (flowCore.setState as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs.metadata.middlewaresConfig.mockMiddlewareWithMetadata).toBeUndefined();
    });

    it('should preserve other middleware configurations when updating one', () => {
      const config1 = { enabled: true, threshold: 5 };
      const config2 = { enabled: false, threshold: 10 };

      middlewareManager.applyMiddlewareConfig('mockMiddleware1', config1);
      middlewareManager.applyMiddlewareConfig('mockMiddleware2', config2);

      const finalCallArgs = (flowCore.setState as ReturnType<typeof vi.fn>).mock.calls[1][0];
      expect(finalCallArgs.metadata.middlewaresConfig.mockMiddleware1).toEqual(config1);
      expect(finalCallArgs.metadata.middlewaresConfig.mockMiddleware2).toEqual(config2);
    });
  });

  describe('getMiddlewareConfig', () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
        // Suppress console warnings during tests
      });
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('should return middleware configuration merged with default metadata', () => {
      const middlewareWithMetadata = {
        name: 'mockMiddlewareWithMetadata',
        defaultMetadata: { enabled: true, threshold: 10 },
        execute: vi.fn(),
      };

      middlewareManager.register(middlewareWithMetadata);
      middlewareManager.applyMiddlewareConfig('mockMiddlewareWithMetadata', { enabled: true, threshold: 20 });

      const config = middlewareManager.getMiddlewareConfig('mockMiddlewareWithMetadata');

      expect(config).toEqual({ enabled: true, threshold: 20 });
    });

    it('should return default metadata when no custom config is set', () => {
      const middlewareWithMetadata = {
        name: 'mockMiddlewareWithMetadata',
        defaultMetadata: { enabled: true, threshold: 10 },
        execute: vi.fn(),
      };

      middlewareManager.register(middlewareWithMetadata);

      const config = middlewareManager.getMiddlewareConfig('mockMiddlewareWithMetadata');

      expect(config).toEqual({ enabled: true, threshold: 10 });
    });

    it('should return empty object when middleware has no default metadata and no config', () => {
      middlewareManager.register(mockMiddleware1);

      const config = middlewareManager.getMiddlewareConfig('mockMiddleware1');

      expect(config).toEqual({});
    });

    it('should warn when accessing config for non-registered middleware', () => {
      const config = middlewareManager.getMiddlewareConfig(
        'nonExistentMiddleware' as keyof MiddlewaresConfigFromMiddlewares<TestMiddlewares>
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[AngularFlow] Accessing middleware config for "nonExistentMiddleware" not found'
      );
      expect(config).toEqual({});
    });

    it('should return configuration from state even if middleware is not registered', () => {
      // Set config directly in state without registering middleware
      middlewareManager.applyMiddlewareConfig('mockMiddleware1', { someConfig: 'value' });

      const config = middlewareManager.getMiddlewareConfig('mockMiddleware1');

      expect(config).toEqual({ someConfig: 'value' });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[AngularFlow] Accessing middleware config for "mockMiddleware1" not found'
      );
    });
  });

  describe('integration tests', () => {
    it('should handle complete middleware lifecycle with configuration', () => {
      const middlewareWithMetadata = {
        name: 'mockMiddlewareWithMetadata',
        defaultMetadata: { enabled: true, threshold: 10 },
        execute: vi.fn(),
      };

      // Register middleware
      const unregister = middlewareManager.register(middlewareWithMetadata);

      // Verify default config is applied
      let config = middlewareManager.getMiddlewareConfig('mockMiddlewareWithMetadata');
      expect(config).toEqual({ enabled: true, threshold: 10 });

      // Update config
      middlewareManager.applyMiddlewareConfig('mockMiddlewareWithMetadata', { enabled: false, threshold: 20 });
      config = middlewareManager.getMiddlewareConfig('mockMiddlewareWithMetadata');
      expect(config).toEqual({ enabled: false, threshold: 20 });

      // Unregister middleware
      unregister();

      // Verify middleware is removed from chain
      expect(middlewareManager['middlewareChain']).not.toContain(middlewareWithMetadata);

      // Verify config is cleaned up
      expect(middlewareManager.applyMiddlewareConfig).toHaveBeenCalledWith('mockMiddlewareWithMetadata', undefined);
    });

    it('should maintain correct middleware order after registration and unregistration', () => {
      const middleware3 = {
        name: 'mockMiddleware3',
        execute: vi.fn(),
      };

      // Register middlewares in order
      middlewareManager.register(mockMiddleware1);
      middlewareManager.register(mockMiddleware2);
      middlewareManager.register(middleware3);

      expect(middlewareManager['middlewareChain']).toEqual([mockMiddleware1, mockMiddleware2, middleware3]);

      // Unregister middle middleware
      middlewareManager.unregister(mockMiddleware2.name);

      expect(middlewareManager['middlewareChain']).toEqual([mockMiddleware1, middleware3]);
    });

    it('should handle execute with no registered middlewares gracefully', () => {
      // Ensure no middlewares are registered
      expect(middlewareManager['middlewareChain']).toHaveLength(0);

      middlewareManager.execute(initialState, stateUpdate, 'changeSelection');

      expect(mockRun).toHaveBeenCalledWith(initialState, stateUpdate, 'changeSelection');
    });
  });
});
