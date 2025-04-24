import { CoreCommandHandler } from './command-handler';
import { MiddlewareManager } from './middleware-manager';
import { middlewares } from './middlewares';
import type { EventMapper } from './types/event-mapper.interface';
import type { InputEventHandler } from './types/input-event-handler.abstract';
import type { Middleware, ModelAction } from './types/middleware.interface';
import type { ModelAdapter } from './types/model-adapter.interface';
import type { Renderer } from './types/renderer.interface';

type EventHandlerFactory = (commandHandler: CoreCommandHandler, eventMapper: EventMapper) => InputEventHandler;

export class FlowCore {
  private commandHandler: CoreCommandHandler;
  private _eventHandler: InputEventHandler;
  private readonly middlewareManager: MiddlewareManager;

  constructor(
    private readonly modelAdapter: ModelAdapter,
    private readonly renderer: Renderer,
    private readonly eventMapper: EventMapper,
    createEventHandler: EventHandlerFactory
  ) {
    this.commandHandler = new CoreCommandHandler(this);
    this._eventHandler = createEventHandler(this.commandHandler, this.eventMapper);
    this.middlewareManager = new MiddlewareManager();
    middlewares.forEach(this.registerMiddleware);
  }

  /**
   * Gets the current EventHandler instance
   */
  get eventHandler(): InputEventHandler {
    return this._eventHandler;
  }

  /**
   * Changes the current EventHandler implementation
   * @param createEventHandler Factory function that creates a new EventHandler instance
   */
  setEventHandler(createEventHandler: EventHandlerFactory): void {
    this._eventHandler = createEventHandler(this.commandHandler, this.eventMapper);
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

  executeMiddlewares(modelAction: ModelAction): void {
    const diff = this.middlewareManager.execute(
      {
        nodes: this.modelAdapter.getNodes(),
        edges: this.modelAdapter.getEdges(),
        metadata: this.modelAdapter.getMetadata(),
      },
      modelAction
    );
    console.log(diff);
  }
}
