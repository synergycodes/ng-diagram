import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../flow-core';
import { mockMetadata, mockNode } from '../test-utils';
import type { FlowState, FlowStateUpdate, Middleware, ModelAdapter } from '../types';
import { MiddlewareManager } from './middleware-manager';

vi.mock('./middlewares/edges-routing', () => ({
  edgesRoutingMiddleware: {
    name: 'edges-routing',
    execute: vi.fn().mockImplementation((state) => state),
  },
}));

const mockMeasuredBoundsMiddleware = vi.hoisted(() => ({
  name: 'measured-bounds',
  execute: vi.fn(),
}));

const mockLoggerMiddleware = vi.hoisted(() => ({
  name: 'logger',
  execute: vi.fn(),
}));

const mockMeasurementTrackingMiddleware = vi.hoisted(() => ({
  name: 'measurement-tracking',
  execute: vi.fn(),
}));

vi.mock('./middlewares', () => ({
  createEventEmitterMiddleware: vi.fn(),
  createMeasurementTrackingMiddleware: vi.fn().mockReturnValue(mockMeasurementTrackingMiddleware),
  measuredBoundsMiddleware: mockMeasuredBoundsMiddleware,
  loggerMiddleware: mockLoggerMiddleware,
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
  Middleware<'mockMiddlewareWithMetadata'>,
];
describe('MiddlewareManager', () => {
  let flowCore: FlowCore;
  let mockMiddleware1: Middleware<'mockMiddleware1'>;
  let mockMiddleware2: Middleware<'mockMiddleware2'>;
  let middlewareManager: MiddlewareManager;
  let initialState: FlowState;
  let stateUpdate: FlowStateUpdate;
  let MiddlewareExecutor: unknown;
  let mockModel: ModelAdapter;

  beforeEach(async () => {
    const module = await import('./middleware-executor');
    MiddlewareExecutor = module.MiddlewareExecutor;

    const getMetadataMock = vi.fn().mockReturnValue({
      viewport: { x: 0, y: 0, scale: 1 },
      middlewaresConfig: {},
    });

    mockModel = {
      getMetadata: getMetadataMock,
      updateMetadata: vi.fn(),
      getNodes: vi.fn(),
      getEdges: vi.fn(),
      updateNodes: vi.fn(),
      updateEdges: vi.fn(),
      onChange: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      toJSON: vi.fn(),
    } as unknown as ModelAdapter;

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
      updateMetadata: vi.fn(),
      applyUpdate: vi.fn(),
      model: mockModel,
      measurementTracker: {
        hasPendingMeasurements: vi.fn().mockReturnValue(false),
        signalNodeMeasurement: vi.fn(),
        signalEdgeMeasurement: vi.fn(),
      },
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
    } as unknown as FlowState;
    stateUpdate = {
      nodesToAdd: [mockNode],
    };
  });

  describe('constructor', () => {
    it('should register starting middlewares if they are provided', () => {
      const middlewareManager = new MiddlewareManager(flowCore, [mockMiddleware1] as unknown as TestMiddlewares);
      middlewareManager.execute(initialState, stateUpdate, ['init']);

      expect(MiddlewareExecutor).toHaveBeenCalledWith(flowCore, [
        mockMiddleware1,
        mockMeasuredBoundsMiddleware,
        mockLoggerMiddleware,
        mockMeasurementTrackingMiddleware,
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

    it('should return a function that unregisters the middleware when called', () => {
      const unregister = middlewareManager.register(mockMiddleware1);

      expect(middlewareManager['middlewareChain']).toContain(mockMiddleware1);

      unregister();

      expect(middlewareManager['middlewareChain']).not.toContain(mockMiddleware1);
    });
  });

  describe('unregister', () => {
    it('should unregister a middleware', () => {
      middlewareManager.register(mockMiddleware1);
      middlewareManager.unregister(mockMiddleware1.name);

      middlewareManager.execute(initialState, stateUpdate, ['changeSelection']);
      expect(mockRun).toHaveBeenCalledWith(initialState, stateUpdate, ['changeSelection']);
    });

    it('should handle unregistering a non-existent middleware gracefully', () => {
      expect(() => middlewareManager.unregister(mockMiddleware1.name)).not.toThrow();
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

      middlewareManager.execute(initialState, stateUpdate, ['changeSelection']);

      expect(mockRun).toHaveBeenCalledWith(initialState, stateUpdate, ['changeSelection']);
    });

    it('should return passed next state when no middlewares are registered', () => {
      middlewareManager.execute(initialState, stateUpdate, ['changeSelection']);

      expect(mockRun).toHaveBeenCalledWith(initialState, stateUpdate, ['changeSelection']);
    });
  });

  describe('integration tests', () => {
    it('should handle complete middleware lifecycle', () => {
      const middlewareWithMetadata = {
        name: 'mockMiddlewareWithMetadata',
        defaultMetadata: { enabled: true, threshold: 10 },
        execute: vi.fn(),
      };

      const unregister = middlewareManager.register(middlewareWithMetadata);

      unregister();

      expect(middlewareManager['middlewareChain']).not.toContain(middlewareWithMetadata);
    });

    it('should maintain correct middleware order after registration and unregistration', () => {
      const middleware3 = {
        name: 'mockMiddleware3',
        execute: vi.fn(),
      };

      middlewareManager.register(mockMiddleware1);
      middlewareManager.register(mockMiddleware2);
      middlewareManager.register(middleware3);

      expect(middlewareManager['middlewareChain']).toEqual([mockMiddleware1, mockMiddleware2, middleware3]);

      middlewareManager.unregister(mockMiddleware2.name);

      expect(middlewareManager['middlewareChain']).toEqual([mockMiddleware1, middleware3]);
    });

    it('should handle execute with no registered middlewares gracefully', () => {
      expect(middlewareManager['middlewareChain']).toHaveLength(0);

      middlewareManager.execute(initialState, stateUpdate, ['changeSelection']);

      expect(mockRun).toHaveBeenCalledWith(initialState, stateUpdate, ['changeSelection']);
    });
  });
});
