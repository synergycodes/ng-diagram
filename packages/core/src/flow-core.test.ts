import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreCommandInterpreter } from './command-interpreter';
import { FlowCore } from './flow-core';
import { MiddlewareManager } from './middleware-manager';
import type { CommandHandler } from './types/command-handler.abstract';
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
  let mockCommandHandler: CommandHandler;
  let createCommandHandler: (interpreter: CoreCommandInterpreter) => CommandHandler;

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

    mockCommandHandler = {
      unregisterDefault: vi.fn(),
      register: vi.fn(),
      unregister: vi.fn(),
      invoke: vi.fn(),
    } as unknown as CommandHandler;

    createCommandHandler = vi.fn().mockReturnValue(mockCommandHandler);

    // Reset all mocks
    vi.clearAllMocks();

    // Create FlowCore instance
    flowCore = new FlowCore(mockModelAdapter, mockRenderer, createCommandHandler);
  });

  describe('constructor', () => {
    it('should create a new CommandInterpreter instance', () => {
      expect(flowCore).toBeDefined();
      expect(createCommandHandler).toHaveBeenCalledWith(expect.any(CoreCommandInterpreter));
    });

    it('should initialize with provided dependencies', () => {
      expect(createCommandHandler).toHaveBeenCalled();
      expect(vi.mocked(MiddlewareManager)).toHaveBeenCalled();
    });
  });

  describe('setCommandHandler', () => {
    it('should replace the current CommandHandler with a new one', () => {
      const newCommandHandler = {
        unregisterDefault: vi.fn(),
        register: vi.fn(),
        unregister: vi.fn(),
        invoke: vi.fn(),
      } as unknown as CommandHandler;

      const newCreateCommandHandler = vi.fn().mockReturnValue(newCommandHandler);

      flowCore.setCommandHandler(newCreateCommandHandler);

      expect(newCreateCommandHandler).toHaveBeenCalledWith(expect.any(CoreCommandInterpreter));
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
