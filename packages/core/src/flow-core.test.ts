import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { CoreCommandHandler } from './command-handler';
import { FlowCore } from './flow-core';
import { MiddlewareManager } from './middleware-manager';
import { mockedEdge, mockedNode } from './test-utils';
import { Edge } from './types/edge.interface';
import type { EnvironmentInfo } from './types/environment.interface';
import { EventMapper } from './types/event-mapper.interface';
import type { InputEventHandler } from './types/input-event-handler.abstract';
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

vi.mock('./middleware-manager', () => ({
  MiddlewareManager: vi.fn().mockImplementation(() => mockMiddlewareManager),
}));

describe('FlowCore', () => {
  let flowCore: FlowCore;
  let mockModelAdapter: ModelAdapter;
  let mockRenderer: Renderer;
  let mockEventMapper: EventMapper;
  let mockEventHandler: InputEventHandler;
  let createEventHandler: (
    commandHandler: CoreCommandHandler,
    eventMapper: EventMapper,
    environment: EnvironmentInfo
  ) => InputEventHandler;
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

    mockEventHandler = {
      unregisterDefault: vi.fn(),
      register: vi.fn(),
      unregister: vi.fn(),
      invoke: vi.fn(),
    } as unknown as InputEventHandler;

    createEventHandler = vi.fn().mockReturnValue(mockEventHandler);

    // Reset all mocks
    vi.clearAllMocks();

    // Create FlowCore instance
    flowCore = new FlowCore(mockModelAdapter, mockRenderer, mockEventMapper, createEventHandler, mockEnvironment);
  });

  describe('constructor', () => {
    it('should create a new CommandHandler instance', () => {
      expect(flowCore).toBeDefined();
      expect(createEventHandler).toHaveBeenCalledWith(expect.any(CoreCommandHandler), mockEventMapper, mockEnvironment);
    });

    it('should initialize with provided dependencies', () => {
      expect(createEventHandler).toHaveBeenCalled();
      expect(vi.mocked(MiddlewareManager)).toHaveBeenCalled();
    });

    it('should store the environment information', () => {
      expect(flowCore.getEnvironment()).toEqual(mockEnvironment);
    });

    it('should render the diagram', () => {
      expect(mockRenderer.draw).toHaveBeenCalled();
    });

    it('should register model changed listener', () => {
      expect(mockModelAdapter.onChange).toHaveBeenCalled();
    });
  });

  describe('setEventHandler', () => {
    it('should replace the current EventHandler with a new one', () => {
      const newEventHandler = {
        unregisterDefault: vi.fn(),
        register: vi.fn(),
        unregister: vi.fn(),
        invoke: vi.fn(),
      } as unknown as InputEventHandler;

      const newCreateEventHandler = vi.fn().mockReturnValue(newEventHandler);

      flowCore.setEventHandler(newCreateEventHandler);

      expect(newCreateEventHandler).toHaveBeenCalledWith(
        expect.any(CoreCommandHandler),
        mockEventMapper,
        mockEnvironment
      );
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
      const middleware: Middleware = {
        name: 'test',
        execute: vi.fn(),
      };

      flowCore.unregisterMiddleware(middleware);

      expect(mockMiddlewareManager.unregister).toHaveBeenCalledWith(middleware);
    });
  });

  describe('getState', () => {
    it('should return the current state', () => {
      mockGetNodes.mockReturnValue([mockedNode]);
      mockGetEdges.mockReturnValue([mockedEdge]);
      mockGetMetadata.mockReturnValue({ viewport: { x: 0, y: 0, scale: 1 }, test: 'abc' });
      const state = flowCore.getState();
      expect(state).toEqual({
        nodes: [mockedNode],
        edges: [mockedEdge],
        metadata: { viewport: { x: 0, y: 0, scale: 1 }, test: 'abc' },
      });
    });
  });

  describe('applyUpdate', () => {
    it('should apply the update to the state', () => {
      mockMiddlewareManager.execute.mockReturnValue({
        nodes: [mockedNode],
        edges: [mockedEdge],
        metadata: { test: 'abc' },
      });
      flowCore.applyUpdate({ nodes: [mockedNode] }, 'changeSelection');

      expect(mockModelAdapter.setMetadata).toHaveBeenCalledWith({ test: 'abc' });
      expect(mockModelAdapter.setNodes).toHaveBeenCalledWith([mockedNode]);
      expect(mockModelAdapter.setEdges).toHaveBeenCalledWith([mockedEdge]);
    });

    it('should call the middleware with the correct parameters', () => {
      mockMiddlewareManager.execute.mockReturnValue({
        nodes: [mockedNode],
        edges: [mockedEdge],
        metadata: { test: 'abc' },
      });
      flowCore.applyUpdate({ nodes: [mockedNode] }, 'changeSelection');

      expect(mockMiddlewareManager.execute).toHaveBeenCalledWith(
        { nodes: [], edges: [], metadata: {} },
        { nodes: [mockedNode], edges: [], metadata: {} },
        'changeSelection'
      );
    });
  });
});
