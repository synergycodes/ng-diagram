import { CoreCommandHandler } from './command-handler';
import { MiddlewareManager } from './middleware-manager';
import type { EventHandler } from './types/event-handler.abstract';
import type { EventMapper } from './types/event-mapper.interface';
import type { Middleware } from './types/middleware.interface';
import type { ModelAdapter } from './types/model-adapter.interface';
import type { Renderer } from './types/renderer.interface';

type EventHandlerFactory = (interpreter: CoreCommandHandler, eventMapper: EventMapper) => EventHandler;

export class FlowCore {
  private readonly interpreter: CoreCommandHandler;
  private _eventHandler: EventHandler;
  private readonly middlewareManager: MiddlewareManager;

  constructor(
    private readonly modelAdapter: ModelAdapter,
    private readonly renderer: Renderer,
    private readonly eventMapper: EventMapper,
    createEventHandler: EventHandlerFactory
  ) {
    this.interpreter = new CoreCommandHandler();
    this._eventHandler = createEventHandler(this.interpreter, this.eventMapper);
    this.middlewareManager = new MiddlewareManager();
  }

  /**
   * Gets the current EventHandler instance
   */
  get eventHandler(): EventHandler {
    return this._eventHandler;
  }

  /**
   * Changes the current EventHandler implementation
   * @param createEventHandler Factory function that creates a new EventHandler instance
   */
  setEventHandler(createEventHandler: EventHandlerFactory): void {
    this._eventHandler = createEventHandler(this.interpreter, this.eventMapper);
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
