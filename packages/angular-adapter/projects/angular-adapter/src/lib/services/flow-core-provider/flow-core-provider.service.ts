import { inject, Injectable, signal } from '@angular/core';
import { DeepPartial, FlowConfig, FlowCore, MiddlewareChain, ModelAdapter } from '@angularflow/core';

import { detectEnvironment } from '../../utils/detect-environment';
import { InputEventsRouterService } from '../input-events/input-events-router.service';
import { RendererService } from '../renderer/renderer.service';

@Injectable()
export class FlowCoreProviderService {
  private readonly renderer = inject(RendererService);
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private flowCore: FlowCore | null = null;
  private _isInitialized = signal(false);

  readonly isInitialized = this._isInitialized.asReadonly();

  init(
    model: ModelAdapter,
    middlewares: MiddlewareChain,
    getFlowOffset: () => { x: number; y: number },
    config?: DeepPartial<FlowConfig>
  ): void {
    this.flowCore = new FlowCore(
      model,
      this.renderer,
      this.inputEventsRouter,
      detectEnvironment(),
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
      throw new Error('FlowCore not initialized');
    }

    return this.flowCore;
  }
}
