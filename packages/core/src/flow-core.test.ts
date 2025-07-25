import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { CommandHandler } from './command-handler/command-handler';
import { FlowCore } from './flow-core';
import { InputEventsRouter } from './input-events';
import { MiddlewareManager } from './middleware-manager/middleware-manager';
import { mockEdge, mockMetadata, mockNode } from './test-utils';
import { MiddlewaresConfigFromMiddlewares } from './types';
import { Edge } from './types/edge.interface';
import type { EnvironmentInfo } from './types/environment.interface';
import type { FlowConfig } from './types/flow-config.interface';
import type { Metadata } from './types/metadata.interface';
import type { Middleware, MiddlewareChain } from './types/middleware.interface';
import type { ModelAdapter } from './types/model-adapter.interface';
import type { Node } from './types/node.interface';
import type { Renderer } from './types/renderer.interface';

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
  let flowCore: FlowCore<MiddlewareChain>;
  let mockModelAdapter: ModelAdapter<Metadata<MiddlewaresConfigFromMiddlewares<[]>>>;
  let mockRenderer: Renderer;
  let mockGetNodes: Mock<() => Node[]>;
  let mockGetEdges: Mock<() => Edge[]>;
  let mockGetMetadata: Mock<() => Metadata<MiddlewaresConfigFromMiddlewares<[]>>>;
  let mockEventRouter: InputEventsRouter;
  const mockEnvironment: EnvironmentInfo = { os: 'MacOS', browser: 'Chrome' };

  beforeEach(() => {
    mockGetNodes = vi.fn().mockReturnValue([]);
    mockGetEdges = vi.fn().mockReturnValue([]);
    mockGetMetadata = vi.fn().mockReturnValue({});

    // Create mock implementations
    mockModelAdapter = {
      getNodes: mockGetNodes,
      getEdges: mockGetEdges,
      getMetadata: mockGetMetadata,
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      setMetadata: vi.fn(),
      onChange: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
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

    it('should emit init command', () => {
      expect(mockCommandHandler.emit).toHaveBeenCalledWith('init');
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
    });

    it('should merge provided config with default config', () => {
      const customConfig: Partial<FlowConfig> = {
        zoom: {
          min: 0.5,
          max: 5.0,
          step: 0.1,
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

  describe('set model', () => {
    it('should set new model', () => {
      flowCore.model = { ...mockModelAdapter };

      expect(flowCore.model).not.toBe(mockModelAdapter);
    });

    it('should reinitialize flow core', () => {
      flowCore.model = { ...mockModelAdapter };

      expect(flowCore.commandHandler.emit).toHaveBeenCalledWith('init');
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

      expect(mockModelAdapter.setMetadata).toHaveBeenCalledWith({ test: 'abc' });
      expect(mockModelAdapter.setNodes).toHaveBeenCalledWith([mockNode]);
      expect(mockModelAdapter.setEdges).toHaveBeenCalledWith([mockEdge]);
    });

    it('should call the middleware with the correct parameters', async () => {
      mockGetMetadata.mockReturnValue(mockMetadata);
      mockGetNodes.mockReturnValue([mockNode]);
      mockGetEdges.mockReturnValue([mockEdge]);

      await flowCore.applyUpdate({ nodesToUpdate: [mockNode] }, 'changeSelection');

      expect(mockMiddlewareManager.execute).toHaveBeenCalledWith(
        { nodes: [mockNode], edges: [mockEdge], metadata: mockMetadata },
        { nodesToUpdate: [mockNode] },
        'changeSelection'
      );
    });

    it('should not set any state if the middleware does not return a new state', async () => {
      mockMiddlewareManager.execute.mockResolvedValue(undefined);

      await flowCore.applyUpdate({ nodesToUpdate: [mockNode] }, 'changeSelection');

      expect(mockModelAdapter.setMetadata).not.toHaveBeenCalled();
      expect(mockModelAdapter.setNodes).not.toHaveBeenCalled();
      expect(mockModelAdapter.setEdges).not.toHaveBeenCalled();
    });
  });

  describe('clientToFlowPosition', () => {
    it('should convert client position to flow position', () => {
      mockGetMetadata.mockReturnValue({ ...mockMetadata, viewport: { x: 200, y: 200, scale: 2 } });
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

      mockGetMetadata.mockReturnValue({ ...mockMetadata, viewport: { x: 200, y: 200, scale: 2 } });
      const clientPosition = { x: 30, y: 30 };
      const flowPosition = flowCore.clientToFlowPosition(clientPosition);

      // Expected calculation: (30 - 200 - 50) / 2 = -110, (30 - 200 - 100) / 2 = -135
      expect(flowPosition).toEqual({ x: -110, y: -135 });
    });
  });

  describe('flowToClientPosition', () => {
    it('should convert flow position to client position', () => {
      mockGetMetadata.mockReturnValue({ ...mockMetadata, viewport: { x: 200, y: 200, scale: 2 } });
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

      mockGetMetadata.mockReturnValue({ ...mockMetadata, viewport: { x: 200, y: 200, scale: 2 } });
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
});
