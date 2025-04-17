import { CoreCommandInterpreter } from './command-interpreter';
import { MiddlewareManager } from './middleware-manager';
import type { CommandHandler } from './types/command-handler.abstract';
import type { Middleware } from './types/middleware.interface';
import type { ModelAdapter } from './types/model-adapter.interface';
import type { Renderer } from './types/renderer.interface';

type CommandHandlerFactory = (interpreter: CoreCommandInterpreter) => CommandHandler;

export class FlowCore {
  private readonly interpreter: CoreCommandInterpreter;
  private _commandHandler: CommandHandler;
  private readonly middlewareManager: MiddlewareManager;

  constructor(
    private readonly modelAdapter: ModelAdapter,
    private readonly renderer: Renderer,
    createCommandHandler: CommandHandlerFactory
  ) {
    this.interpreter = new CoreCommandInterpreter();
    this._commandHandler = createCommandHandler(this.interpreter);
    this.middlewareManager = new MiddlewareManager();
  }

  /**
   * Gets the current CommandHandler instance
   */
  get commandHandler(): CommandHandler {
    return this._commandHandler;
  }

  /**
   * Changes the current CommandHandler implementation
   * @param createCommandHandler Factory function that creates a new CommandHandler instance
   */
  setCommandHandler(createCommandHandler: CommandHandlerFactory): void {
    this._commandHandler = createCommandHandler(this.interpreter);
  }

  /**
   * Registers a new middleware in the chain
   * @param middleware Middleware function to register
   * @returns Function to unregister the middleware
   */
  registerMiddleware(middleware: Middleware): () => void {
    return this.middlewareManager.register(middleware);
  }

  /**
   * Unregisters a middleware from the chain
   * @param middleware Middleware function to unregister
   */
  unregisterMiddleware(middleware: Middleware): void {
    this.middlewareManager.unregister(middleware);
  }
}
