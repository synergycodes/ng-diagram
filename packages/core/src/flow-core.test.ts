import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreCommandHandler } from './command-handler';
import { FlowCore } from './flow-core';
import { MiddlewareManager } from './middleware-manager';
import type { EventHandler } from './types/event-handler.abstract';
import { EventMapper } from './types/event-mapper.interface';
import type { Middleware } from './types/middleware.interface';
import type { ModelAdapter } from './types/model-adapter.interface';
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
  let mockEventHandler: EventHandler;
  let createEventHandler: (interpreter: CoreCommandHandler) => EventHandler;

  beforeEach(() => {
    // Create mock implementations
    mockModelAdapter = {
      getNodes: vi.fn(),
      getEdges: vi.fn(),
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      getMetadata: vi.fn(),
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
    } as unknown as EventHandler;

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
      } as unknown as EventHandler;

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
});
