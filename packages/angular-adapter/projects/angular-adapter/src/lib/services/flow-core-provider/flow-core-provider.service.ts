import { inject, Injectable } from '@angular/core';
import { FlowCore, Metadata, MiddlewareChain, MiddlewaresConfigFromMiddlewares, ModelAdapter } from '@angularflow/core';

import { EventMapperService } from '../event-mapper/event-mapper.service';
import { InputEventsRouterService } from '../input-events/input-events-router.service';
import { RendererService } from '../renderer/renderer.service';
import { detectEnvironment } from './detect-environment';

@Injectable({ providedIn: 'root' })
export class FlowCoreProviderService<TMiddlewares extends MiddlewareChain = []> {
  private readonly renderer = inject(RendererService);
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly eventMapper = inject(EventMapperService);
  private flowCore: FlowCore<TMiddlewares> | null = null;

  init(
    model: ModelAdapter<Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>>>,
    middlewares: TMiddlewares = [] as unknown as TMiddlewares
  ): void {
    this.flowCore = new FlowCore(
      model,
      this.renderer,
      this.eventMapper,
      this.inputEventsRouter,
      detectEnvironment(),
      middlewares
    );
  }

  provide(): FlowCore<TMiddlewares> {
    if (!this.flowCore) {
      throw new Error('FlowCore not initialized');
    }

    return this.flowCore;
  }
}
