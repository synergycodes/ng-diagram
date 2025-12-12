import { Injectable, inject, signal } from '@angular/core';
import {
  type DeepPartial,
  type FlowConfig,
  FlowCore,
  type MiddlewareChain,
  type ModelAdapter,
  type Point,
} from '../../../core/src';
import { EnvironmentProviderService } from '../environment-provider/environment-provider.service';
import { InputEventsRouterService } from '../input-events/input-events-router.service';
import { RendererService } from '../renderer/renderer.service';

@Injectable()
export class FlowCoreProviderService {
  private readonly renderer = inject(RendererService);
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly environment = inject(EnvironmentProviderService);
  private flowCore: FlowCore | null = null;
  private _isInitialized = signal(false);

  readonly isInitialized = this._isInitialized.asReadonly();

  init(
    model: ModelAdapter,
    middlewares: MiddlewareChain,
    getFlowOffset: () => Point,
    config?: DeepPartial<FlowConfig>
  ): void {
    this.flowCore = new FlowCore(
      model,
      this.renderer,
      this.inputEventsRouter,
      this.environment,
      middlewares,
      getFlowOffset,
      config
    );

    this._isInitialized.set(true);
  }

  destroy(): void {
    if (this.flowCore) {
      this.flowCore.destroy();
      this.flowCore = null;
      this._isInitialized.set(false);
    }
  }

  provide(): FlowCore {
    if (!this.flowCore) {
      throw new Error(
        `[ngDiagram] Library engine not initialized yet.

To fix this, wait for initialization to complete using one of these methods:
  • Use "isInitialized" signal from NgDiagramService
  • Use "diagramInit" event handler passed to NgDiagramComponent

Documentation: https://www.ngdiagram.dev/docs/guides/model-initialization/#waiting-for-initialization
`
      );
    }

    return this.flowCore;
  }
}
