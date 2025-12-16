/* eslint-disable @typescript-eslint/no-empty-function */
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { CommandHandler } from './command-handler/command-handler';
import { FlowCore } from './flow-core';
import type { InputEventsRouter } from './input-events';
import { MiddlewareManager } from './middleware-manager/middleware-manager';
import { mockEdge, mockEnvironment, mockMetadata, mockNode } from './test-utils';
import type { Edge } from './types/edge.interface';
import type { FlowConfig } from './types/flow-config.interface';
import type { Metadata } from './types/metadata.interface';
import type { Middleware } from './types/middleware.interface';
import type { ModelAdapter } from './types/model-adapter.interface';
import type { Node } from './types/node.interface';
import type { Renderer } from './types/renderer.interface';
import type { TransactionOptions } from './types/transaction.interface';

vi.mock('./updater/init-updater/init-updater', () => ({
  InitUpdater: vi.fn(() => ({
    start: vi.fn((callback) => {
      // Simulate async initialization
      if (callback) {
        setTimeout(callback, 0);
      }
    }),
    isInitialized: false,
  })),
}));

const mockMiddlewareManager = {
  register: vi.fn(),
  unregister: vi.fn(),
  execute: vi.fn(),
};

vi.mock('./middleware-manager/middleware-manager', () => ({
  MiddlewareManager: vi.fn().mockImplementation(() => mockMiddlewareManager),
}));

const mockCommandHandler = {
  emit: vi.fn(),
};

vi.mock('./command-handler/command-handler', () => ({
  CommandHandler: vi.fn().mockImplementation(() => mockCommandHandler),
}));

const mockInputEventHandler = {
  unregisterDefault: vi.fn(),
  register: vi.fn(),
  unregister: vi.fn(),
  invoke: vi.fn(),
};

vi.mock('./input-event-handler/input-event-handler', () => ({
  InputEventHandler: vi.fn().mockImplementation(() => mockInputEventHandler),
}));

// Mock ModelLookup
const mockModelLookup = {
  getNodeById: vi.fn(),
  getEdgeById: vi.fn(),
  getChildrenIds: vi.fn(),
  hasChildren: vi.fn(),
  hasDescendants: vi.fn(),
  getNodeChildren: vi.fn(),
  getSelectedNodes: vi.fn(),
  getSelectedEdges: vi.fn(),
  getSelectedNodesWithChildren: vi.fn(),
  isNodeDescendantOfGroup: vi.fn(),
  getChildrenMap: vi.fn(),
  desynchronize: vi.fn(),
};

vi.mock('./model-lookup/model-lookup', () => ({
  ModelLookup: vi.fn().mockImplementation(() => mockModelLookup),
}));

describe('FlowCore', () => {
  let flowCore: FlowCore;
  let mockModelAdapter: ModelAdapter;
  let mockRenderer: Renderer;
  let mockDestroy: Mock;
  let mockGetNodes: Mock<() => Node[]>;
  let mockGetEdges: Mock<() => Edge[]>;
  let mockGetMetadata: Mock<() => Metadata>;
  let mockEventRouter: InputEventsRouter;

  beforeEach(() => {
    mockGetNodes = vi.fn().mockReturnValue([]);
    mockGetEdges = vi.fn().mockReturnValue([]);
    mockGetMetadata = vi.fn().mockReturnValue({});
    mockDestroy = vi.fn();

    // Create mock implementations
    mockModelAdapter = {
      destroy: mockDestroy,
      getNodes: mockGetNodes,
      getEdges: mockGetEdges,
      getMetadata: mockGetMetadata,
      updateNodes: vi.fn(),
      updateEdges: vi.fn(),
      updateMetadata: vi.fn(),
      onChange: vi.fn(),
      unregisterOnChange: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      toJSON: vi.fn(),
    };

    mockRenderer = {
      draw: vi.fn(),
    };

    mockEventRouter = {
      emit: vi.fn(),
      register: vi.fn(),
      registerDefaultCallbacks: vi.fn(),
    } as unknown as InputEventsRouter;

    // Reset all mocks
    vi.clearAllMocks();

    // Create FlowCore instance
    flowCore = new FlowCore(mockModelAdapter, mockRenderer, mockEventRouter, mockEnvironment);
  });

  describe('constructor', () => {
    it('should initialize with provided dependencies', () => {
      expect(vi.mocked(MiddlewareManager)).toHaveBeenCalled();
      expect(vi.mocked(CommandHandler)).toHaveBeenCalledWith(flowCore);
      // expect(vi.mocked(InputEventHandler)).toHaveBeenCalledWith(flowCore);
    });

    it('should store the environment information', () => {
      expect(flowCore.getEnvironment()).toEqual(mockEnvironment);
    });

    it('should pass starting middlewares to MiddlewareManager', () => {
      const middleware: Middleware = { name: 'test', execute: vi.fn() };

      flowCore = new FlowCore(mockModelAdapter, mockRenderer, mockEventRouter, mockEnvironment, [middleware]);

      expect(MiddlewareManager).toHaveBeenCalledWith(flowCore, [middleware]);
    });

    it('should register model changed listener', () => {
      expect(mockModelAdapter.onChange).toHaveBeenCalled();
    });

    it('should emit init command after initialization completes', async () => {
      // Initially, init command should not be called yet
      expect(mockCommandHandler.emit).not.toHaveBeenCalledWith('init', expect.anything());

      // Wait for the initialization callback to be executed
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Now init command should have been emitted
      // When virtualization is disabled, renderedNodeIds/renderedEdgeIds are undefined (meaning "all rendered")
      expect(mockCommandHandler.emit).toHaveBeenCalledWith('init', {
        renderedNodeIds: undefined,
        renderedEdgeIds: undefined,
      });
    });

    it('should initialize with default getFlowOffset when not provided', () => {
      expect(flowCore.getFlowOffset).toBeDefined();
      expect(flowCore.getFlowOffset()).toEqual({ x: 0, y: 0 });
    });

    it('should use provided getFlowOffset function', () => {
      const customGetFlowOffset = vi.fn().mockReturnValue({ x: 10, y: 20 });

      flowCore = new FlowCore(
        mockModelAdapter,
        mockRenderer,
        mockEventRouter,
        mockEnvironment,
        undefined,
        customGetFlowOffset
      );

      expect(flowCore.getFlowOffset()).toEqual({ x: 10, y: 20 });
      expect(customGetFlowOffset).toHaveBeenCalled();
    });

    it('should initialize with default config when not provided', () => {
      expect(flowCore.config).toBeDefined();
      expect(flowCore.config.computeNodeId).toBeDefined();
      expect(flowCore.config.computeEdgeId).toBeDefined();
      expect(flowCore.config.resize).toBeDefined();
      expect(flowCore.config.linking).toBeDefined();
      expect(flowCore.config.grouping).toBeDefined();
      expect(flowCore.config.zoom).toBeDefined();
      expect(flowCore.config.nodeRotation).toBeDefined();
    });

    it('should merge provided config with default config', () => {
      const customConfig: Partial<FlowConfig> = {
        zoom: {
          min: 0.5,
          max: 5.0,
          step: 0.1,
          zoomToFit: { onInit: false, padding: 20 },
        },
      };

      flowCore = new FlowCore(
        mockModelAdapter,
        mockRenderer,
        mockEventRouter,
        mockEnvironment,
        undefined,
        undefined,
        customConfig
      );

      expect(flowCore.config.zoom.min).toBe(0.5);
      expect(flowCore.config.zoom.max).toBe(5.0);
      expect(flowCore.config.zoom.step).toBe(0.1);
      // Should still have default values for other config properties
      expect(flowCore.config.computeNodeId).toBeDefined();
      expect(flowCore.config.linking.portSnapDistance).toBe(10); // default value
    });
  });

  describe('get model', () => {
    it('should return the current model', () => {
      expect(flowCore.model).toBe(mockModelAdapter);
    });
  });

  describe('middleware registration', () => {
    it('should delegate middleware registration to MiddlewareManager', () => {
      const middleware: Middleware = {
        name: 'test',
        execute: vi.fn(),
      };
      const unregisterFn = vi.fn();

      mockMiddlewareManager.register.mockReturnValue(unregisterFn);

      const result = flowCore.registerMiddleware(middleware);

      expect(mockMiddlewareManager.register).toHaveBeenCalledWith(middleware);
      expect(result).toBe(unregisterFn);
    });

    it('should delegate middleware unregistration to MiddlewareManager', () => {
      flowCore.unregisterMiddleware('node-position-snap');

      expect(mockMiddlewareManager.unregister).toHaveBeenCalledWith('node-position-snap');
    });
  });

  describe('getState', () => {
    it('should return the current state', () => {
      mockGetNodes.mockReturnValue([mockNode]);
      mockGetEdges.mockReturnValue([mockEdge]);
      mockGetMetadata.mockReturnValue(mockMetadata);
      const state = flowCore.getState();
      expect(state).toEqual({
        nodes: [mockNode],
        edges: [mockEdge],
        metadata: mockMetadata,
      });
    });
  });

  describe('applyUpdate', () => {
    it('should apply the update to the state', async () => {
      const finalState = {
        nodes: [mockNode],
        edges: [mockEdge],
        metadata: { test: 'abc' },
      };

      mockMiddlewareManager.execute.mockResolvedValue(finalState);

      await flowCore.applyUpdate({ nodesToUpdate: [mockNode] }, 'changeSelection');

      expect(mockModelAdapter.updateMetadata).toHaveBeenCalledWith({
        test: 'abc',
      });
      expect(mockModelAdapter.updateNodes).toHaveBeenCalledWith([mockNode]);
      expect(mockModelAdapter.updateEdges).toHaveBeenCalledWith([mockEdge]);
    });

    it('should flush deferred emits when state is applied', async () => {
      const finalState = {
        nodes: [mockNode],
        edges: [mockEdge],
        metadata: { test: 'abc' },
      };

      mockMiddlewareManager.execute.mockResolvedValue(finalState);
      const flushSpy = vi.spyOn(flowCore.eventManager, 'flushDeferredEmits');

      await flowCore.applyUpdate({ nodesToUpdate: [mockNode] }, 'changeSelection');

      expect(flushSpy).toHaveBeenCalled();
    });

    it('should call the middleware with the correct parameters', async () => {
      mockGetMetadata.mockReturnValue(mockMetadata);
      mockGetNodes.mockReturnValue([mockNode]);
      mockGetEdges.mockReturnValue([mockEdge]);

      await flowCore.applyUpdate({ nodesToUpdate: [mockNode] }, 'changeSelection');

      expect(mockMiddlewareManager.execute).toHaveBeenCalledWith(
        { nodes: [mockNode], edges: [mockEdge], metadata: mockMetadata },
        { nodesToUpdate: [mockNode] },
        ['changeSelection']
      );
    });

    it('should not set any state if the middleware does not return a new state', async () => {
      mockMiddlewareManager.execute.mockResolvedValue(undefined);

      await flowCore.applyUpdate({ nodesToUpdate: [mockNode] }, 'changeSelection');

      expect(mockModelAdapter.updateMetadata).not.toHaveBeenCalled();
      expect(mockModelAdapter.updateNodes).not.toHaveBeenCalled();
      expect(mockModelAdapter.updateEdges).not.toHaveBeenCalled();
    });

    it('should clear deferred emits when state is not applied', async () => {
      mockMiddlewareManager.execute.mockResolvedValue(undefined);
      const clearSpy = vi.spyOn(flowCore.eventManager, 'clearDeferredEmits');

      await flowCore.applyUpdate({ nodesToUpdate: [mockNode] }, 'changeSelection');

      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('clientToFlowPosition', () => {
    it('should convert client position to flow position', () => {
      mockGetMetadata.mockReturnValue({
        ...mockMetadata,
        viewport: { x: 200, y: 200, scale: 2 },
      });
      const clientPosition = { x: 30, y: 30 };
      const flowPosition = flowCore.clientToFlowPosition(clientPosition);

      expect(flowPosition).toEqual({ x: -85, y: -85 });
    });

    it('should convert client position to flow position with flow offset', () => {
      const customGetFlowOffset = vi.fn().mockReturnValue({ x: 50, y: 100 });
      flowCore = new FlowCore(
        mockModelAdapter,
        mockRenderer,
        mockEventRouter,
        mockEnvironment,
        undefined,
        customGetFlowOffset
      );

      mockGetMetadata.mockReturnValue({
        ...mockMetadata,
        viewport: { x: 200, y: 200, scale: 2 },
      });
      const clientPosition = { x: 30, y: 30 };
      const flowPosition = flowCore.clientToFlowPosition(clientPosition);

      // Expected calculation: (30 - 200 - 50) / 2 = -110, (30 - 200 - 100) / 2 = -135
      expect(flowPosition).toEqual({ x: -110, y: -135 });
    });
  });

  describe('flowToClientPosition', () => {
    it('should convert flow position to client position', () => {
      mockGetMetadata.mockReturnValue({
        ...mockMetadata,
        viewport: { x: 200, y: 200, scale: 2 },
      });
      const flowPosition = { x: -85, y: -85 };
      const clientPosition = flowCore.flowToClientPosition(flowPosition);

      expect(clientPosition).toEqual({ x: 30, y: 30 });
    });

    it('should convert flow position to client position with flow offset', () => {
      const customGetFlowOffset = vi.fn().mockReturnValue({ x: 50, y: 100 });
      flowCore = new FlowCore(
        mockModelAdapter,
        mockRenderer,
        mockEventRouter,
        mockEnvironment,
        undefined,
        customGetFlowOffset
      );

      mockGetMetadata.mockReturnValue({
        ...mockMetadata,
        viewport: { x: 200, y: 200, scale: 2 },
      });
      const flowPosition = { x: -110, y: -135 };
      const clientPosition = flowCore.flowToClientPosition(flowPosition);

      // Expected calculation: -110 * 2 + 200 + 50 = 30, -135 * 2 + 200 + 100 = 30
      expect(clientPosition).toEqual({ x: 30, y: 30 });
    });
  });

  describe('getNodeById', () => {
    it('should return the node by id', () => {
      mockModelLookup.getNodeById.mockReturnValue(mockNode);
      const node = flowCore.getNodeById(mockNode.id);
      expect(node).toBe(mockNode);
      expect(mockModelLookup.getNodeById).toHaveBeenCalledWith(mockNode.id);
    });

    it('should return null if the node is not found', () => {
      mockModelLookup.getNodeById.mockReturnValue(null);
      const node = flowCore.getNodeById('non-existent');
      expect(node).toBeNull();
      expect(mockModelLookup.getNodeById).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('transaction', () => {
    it('should execute transaction with callback only', async () => {
      const result = await flowCore.transaction(async () => {});

      expect(result).toEqual({
        results: expect.any(Object),
        commandsCount: expect.any(Number),
        actionTypes: expect.any(Array),
      });
    });

    it('should execute transaction with name and callback', async () => {
      const result = await flowCore.transaction('testAction', async () => {});

      expect(result).toEqual({
        results: expect.any(Object),
        commandsCount: expect.any(Number),
        actionTypes: expect.any(Array),
      });
    });

    it('should throw error when callback is not provided with name', async () => {
      await expect(flowCore.transaction('testAction', undefined as never)).rejects.toThrow();
    });

    it('should accept options with callback', async () => {
      const options: TransactionOptions = { waitForMeasurements: true };

      const result = await flowCore.transaction(async () => {}, options);

      expect(result).toEqual({
        results: expect.any(Object),
        commandsCount: expect.any(Number),
        actionTypes: expect.any(Array),
      });
    });

    it('should accept options with name and callback', async () => {
      const options: TransactionOptions = { waitForMeasurements: true };

      const result = await flowCore.transaction('testAction', async () => {}, options);

      expect(result).toEqual({
        results: expect.any(Object),
        commandsCount: expect.any(Number),
        actionTypes: expect.any(Array),
      });
    });

    it('should track state update when waitForMeasurements is true and has commands', async () => {
      const trackSpy = vi.spyOn(flowCore.measurementTracker, 'trackStateUpdate');
      const waitSpy = vi.spyOn(flowCore.measurementTracker, 'waitForMeasurements').mockResolvedValue();

      vi.spyOn(flowCore.transactionManager, 'transaction').mockResolvedValue({
        results: { nodesToAdd: [mockNode] },
        commandsCount: 1,
        actionTypes: ['addNodes'],
      });

      mockMiddlewareManager.execute.mockResolvedValue({
        nodes: [mockNode],
        edges: [],
        metadata: mockMetadata,
      });

      await flowCore.transaction(async () => {}, { waitForMeasurements: true });

      expect(trackSpy).toHaveBeenCalledWith({ nodesToAdd: [mockNode] }, undefined, undefined);
      expect(waitSpy).toHaveBeenCalled();
    });

    it('should not track state update when waitForMeasurements is false', async () => {
      const trackSpy = vi.spyOn(flowCore.measurementTracker, 'trackStateUpdate');

      vi.spyOn(flowCore.transactionManager, 'transaction').mockResolvedValue({
        results: { nodesToAdd: [mockNode] },
        commandsCount: 1,
        actionTypes: ['addNodes'],
      });

      mockMiddlewareManager.execute.mockResolvedValue({
        nodes: [mockNode],
        edges: [],
        metadata: mockMetadata,
      });

      await flowCore.transaction(async () => {});

      expect(trackSpy).not.toHaveBeenCalled();
    });

    it('should not track state update when commandsCount is 0', async () => {
      const trackSpy = vi.spyOn(flowCore.measurementTracker, 'trackStateUpdate');

      vi.spyOn(flowCore.transactionManager, 'transaction').mockResolvedValue({
        results: {},
        commandsCount: 0,
        actionTypes: [],
      });

      await flowCore.transaction(async () => {}, { waitForMeasurements: true });

      expect(trackSpy).not.toHaveBeenCalled();
    });

    it('should apply update when transaction has commands', async () => {
      vi.spyOn(flowCore.transactionManager, 'transaction').mockResolvedValue({
        results: { nodesToAdd: [mockNode] },
        commandsCount: 1,
        actionTypes: ['addNodes'],
      });

      mockMiddlewareManager.execute.mockResolvedValue({
        nodes: [mockNode],
        edges: [],
        metadata: mockMetadata,
      });

      await flowCore.transaction(async () => {});

      expect(mockMiddlewareManager.execute).toHaveBeenCalledWith(expect.any(Object), { nodesToAdd: [mockNode] }, [
        'addNodes',
      ]);
    });

    it('should not apply update when transaction has no commands', async () => {
      vi.spyOn(flowCore.transactionManager, 'transaction').mockResolvedValue({
        results: {},
        commandsCount: 0,
        actionTypes: [],
      });

      await flowCore.transaction(async () => {});

      expect(mockMiddlewareManager.execute).not.toHaveBeenCalled();
    });
  });
});
