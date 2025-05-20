import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { CommandHandler } from './command-handler/command-handler';
import { FlowCore } from './flow-core';
import { InputEventHandler } from './input-event-handler/input-event-handler';
import { MiddlewareManager } from './middleware-manager/middleware-manager';
import { mockEdge, mockNode, mockPort } from './test-utils';
import { Edge } from './types/edge.interface';
import type { EnvironmentInfo } from './types/environment.interface';
import { EventMapper } from './types/event-mapper.interface';
import type { Metadata } from './types/metadata.interface';
import type { Middleware } from './types/middleware.interface';
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

describe('FlowCore', () => {
  let flowCore: FlowCore;
  let mockModelAdapter: ModelAdapter;
  let mockRenderer: Renderer;
  let mockEventMapper: EventMapper;
  let mockGetNodes: Mock<() => Node[]>;
  let mockGetEdges: Mock<() => Edge[]>;
  let mockGetMetadata: Mock<() => Metadata>;
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

    mockEventMapper = {
      register: vi.fn(),
      emit: vi.fn(),
    } as unknown as EventMapper;

    // Reset all mocks
    vi.clearAllMocks();

    // Create FlowCore instance
    flowCore = new FlowCore(mockModelAdapter, mockRenderer, mockEventMapper, mockEnvironment);
  });

  describe('constructor', () => {
    it('should initialize with provided dependencies', () => {
      expect(vi.mocked(MiddlewareManager)).toHaveBeenCalled();
      expect(vi.mocked(CommandHandler)).toHaveBeenCalledWith(flowCore);
      expect(vi.mocked(InputEventHandler)).toHaveBeenCalledWith(flowCore);
    });

    it('should store the environment information', () => {
      expect(flowCore.getEnvironment()).toEqual(mockEnvironment);
    });

    it('should pass starting middlewares to MiddlewareManager', () => {
      const middleware: Middleware = { name: 'test', execute: vi.fn() };

      flowCore = new FlowCore(mockModelAdapter, mockRenderer, mockEventMapper, mockEnvironment, [middleware]);

      expect(MiddlewareManager).toHaveBeenCalledWith(flowCore, [middleware]);
    });

    it('should register model changed listener', () => {
      expect(mockModelAdapter.onChange).toHaveBeenCalled();
    });

    it('should emit init command', () => {
      expect(mockCommandHandler.emit).toHaveBeenCalledWith('init');
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
      flowCore.unregisterMiddleware('test');

      expect(mockMiddlewareManager.unregister).toHaveBeenCalledWith('test');
    });
  });

  describe('getState', () => {
    it('should return the current state', () => {
      mockGetNodes.mockReturnValue([mockNode]);
      mockGetEdges.mockReturnValue([mockEdge]);
      mockGetMetadata.mockReturnValue({ viewport: { x: 0, y: 0, scale: 1 }, test: 'abc' });
      const state = flowCore.getState();
      expect(state).toEqual({
        nodes: [mockNode],
        edges: [mockEdge],
        metadata: { viewport: { x: 0, y: 0, scale: 1 }, test: 'abc' },
      });
    });
  });

  describe('applyUpdate', () => {
    it('should apply the update to the state', () => {
      mockMiddlewareManager.execute.mockReturnValue({
        nodes: [mockNode],
        edges: [mockEdge],
        metadata: { test: 'abc' },
      });
      flowCore.applyUpdate({ nodes: [mockNode] }, 'changeSelection');

      expect(mockModelAdapter.setMetadata).toHaveBeenCalledWith({ test: 'abc' });
      expect(mockModelAdapter.setNodes).toHaveBeenCalledWith([mockNode]);
      expect(mockModelAdapter.setEdges).toHaveBeenCalledWith([mockEdge]);
    });

    it('should call the middleware with the correct parameters', () => {
      mockMiddlewareManager.execute.mockReturnValue({
        nodes: [mockNode],
        edges: [mockEdge],
        metadata: { test: 'abc' },
      });
      flowCore.applyUpdate({ nodes: [mockNode] }, 'changeSelection');

      expect(mockMiddlewareManager.execute).toHaveBeenCalledWith(
        { nodes: [], edges: [], metadata: {} },
        { nodes: [mockNode], edges: [], metadata: {} },
        'changeSelection'
      );
    });
  });

  describe('registerEventsHandler', () => {
    it('should register the event handler', () => {
      flowCore.registerEventsHandler(vi.fn());

      expect(mockEventMapper.register).toHaveBeenCalled();
    });
  });

  describe('clientToFlowPosition', () => {
    it('should convert client position to flow position', () => {
      mockGetMetadata.mockReturnValue({ viewport: { x: 200, y: 200, scale: 2 } });
      const clientPosition = { x: 30, y: 30 };
      const flowPosition = flowCore.clientToFlowPosition(clientPosition);

      expect(flowPosition).toEqual({ x: -85, y: -85 });
    });
  });

  describe('flowToClientPosition', () => {
    it('should convert flow position to client position', () => {
      mockGetMetadata.mockReturnValue({ viewport: { x: 200, y: 200, scale: 2 } });
      const flowPosition = { x: -85, y: -85 };
      const clientPosition = flowCore.flowToClientPosition(flowPosition);

      expect(clientPosition).toEqual({ x: 30, y: 30 });
    });
  });

  describe('getNodeById', () => {
    it('should return the node by id', () => {
      mockGetNodes.mockReturnValue([mockNode]);
      const node = flowCore.getNodeById(mockNode.id);
      expect(node).toEqual(mockNode);
    });

    it('should return null if the node is not found', () => {
      mockGetNodes.mockReturnValue([mockNode]);
      const node = flowCore.getNodeById('node-2');
      expect(node).toBeNull();
    });
  });

  describe('getFlowPortPosition', () => {
    it('should return null if the port is not found', () => {
      const position = flowCore.getFlowPortPosition(mockNode, 'port-1');
      expect(position).toBeNull();
    });

    it('should return proper flow port position for top side', () => {
      const position = flowCore.getFlowPortPosition(
        {
          ...mockNode,
          position: { x: 100, y: 100 },
          ports: [{ ...mockPort, side: 'top', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
        },
        mockPort.id
      );

      expect(position).toEqual({ x: 155, y: 150 });
    });

    it('should return proper flow port position for bottom side', () => {
      const position = flowCore.getFlowPortPosition(
        {
          ...mockNode,
          position: { x: 100, y: 100 },
          ports: [{ ...mockPort, side: 'bottom', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
        },
        mockPort.id
      );

      expect(position).toEqual({ x: 155, y: 160 });
    });

    it('should return proper flow port position for left side', () => {
      const position = flowCore.getFlowPortPosition(
        {
          ...mockNode,
          position: { x: 100, y: 100 },
          ports: [{ ...mockPort, side: 'left', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
        },
        mockPort.id
      );

      expect(position).toEqual({ x: 105, y: 155 });
    });

    it('should return proper flow port position for right side', () => {
      const position = flowCore.getFlowPortPosition(
        {
          ...mockNode,
          position: { x: 100, y: 100 },
          ports: [{ ...mockPort, side: 'right', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
        },
        mockPort.id
      );

      expect(position).toEqual({ x: 160, y: 155 });
    });
  });
});
