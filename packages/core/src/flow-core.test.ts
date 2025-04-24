import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { CoreCommandHandler } from './command-handler';
import { FlowCore } from './flow-core';
import { MiddlewareManager } from './middleware-manager';
import { mockedEdge, mockedNode } from './test-utils';
import { Edge } from './types/edge.interface';
import { EventMapper } from './types/event-mapper.interface';
import type { InputEventHandler } from './types/input-event-handler.abstract';
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
  let createEventHandler: (interpreter: CoreCommandHandler) => InputEventHandler;
  let mockGetNodes: Mock<() => Node[]>;
  let mockGetEdges: Mock<() => Edge[]>;
  let mockGetMetadata: Mock<() => Record<string, unknown>>;

  beforeEach(() => {
    mockGetNodes = vi.fn().mockReturnValue([]);
    mockGetEdges = vi.fn().mockReturnValue([]);
    mockGetMetadata = vi.fn().mockReturnValue({});

    // Create mock implementations
    mockModelAdapter = {
      getNodes: vi.fn().mockReturnValue([]),
      getEdges: vi.fn().mockReturnValue([]),
      getMetadata: vi.fn().mockReturnValue({}),
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
    flowCore = new FlowCore(mockModelAdapter, mockRenderer, mockEventMapper, createEventHandler);
  });

  describe('constructor', () => {
    it('should create a new CommandHandler instance', () => {
      expect(flowCore).toBeDefined();
      expect(createEventHandler).toHaveBeenCalledWith(expect.any(CoreCommandHandler), mockEventMapper);
    });

    it('should initialize with provided dependencies', () => {
      expect(createEventHandler).toHaveBeenCalled();
      expect(vi.mocked(MiddlewareManager)).toHaveBeenCalled();
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

      expect(newCreateEventHandler).toHaveBeenCalledWith(expect.any(CoreCommandHandler), mockEventMapper);
    });
  });

  describe('middleware registration', () => {
    it('should delegate middleware registration to MiddlewareManager', () => {
      const middleware: Middleware = vi.fn();
      const unregisterFn = vi.fn();

      mockMiddlewareManager.register.mockReturnValue(unregisterFn);

      const result = flowCore.registerMiddleware(middleware);

      expect(mockMiddlewareManager.register).toHaveBeenCalledWith(middleware);
      expect(result).toBe(unregisterFn);
    });

    it('should delegate middleware unregistration to MiddlewareManager', () => {
      const middleware: Middleware = vi.fn();

      flowCore.unregisterMiddleware(middleware);

      expect(mockMiddlewareManager.unregister).toHaveBeenCalledWith(middleware);
    });
  });

  describe('getState', () => {
    it('should return the current state', () => {
      mockGetNodes.mockReturnValue([mockedNode]);
      mockGetEdges.mockReturnValue([mockedEdge]);
      mockGetMetadata.mockReturnValue({ test: 'abc' });
      const state = flowCore.getState();
      expect(state).toEqual({
        nodes: [mockedNode],
        edges: [mockedEdge],
        metadata: { test: 'abc' },
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

      expect(mockModelAdapter.setNodes).toHaveBeenCalledWith([mockedNode]);
    });

    it('should call the middleware with the correct parameters', () => {
      mockMiddlewareManager.execute.mockReturnValue({
        nodes: [mockedNode],
        edges: [mockedEdge],
        metadata: { test: 'abc' },
      });
      flowCore.applyUpdate({ nodes: [mockedNode] }, 'selectionChange');

      expect(mockMiddlewareManager.execute).toHaveBeenCalledWith(
        { nodes: [], edges: [], metadata: {} },
        { nodes: [mockedNode], edges: [], metadata: {} },
        'selectionChange'
      );
    });
  });
});
