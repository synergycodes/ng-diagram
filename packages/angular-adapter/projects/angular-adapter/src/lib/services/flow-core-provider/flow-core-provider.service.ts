import { Injectable, inject } from '@angular/core';
import { FlowCore, type Middleware, type ModelAdapter } from '@angularflow/core';

import { EventMapperService } from '../event-mapper/event-mapper.service';
import { RendererService } from '../renderer/renderer.service';
import { detectEnvironment } from './detect-environment';

@Injectable({ providedIn: 'root' })
export class FlowCoreProviderService {
  private readonly renderer = inject(RendererService);
  private readonly eventMapper = inject(EventMapperService);
  private flowCore: FlowCore | null = null;

  init(model: ModelAdapter, middlewares: Middleware[] = []): void {
    this.flowCore = new FlowCore(model, this.renderer, this.eventMapper, detectEnvironment(), middlewares);
  }

  provide(): FlowCore {
    if (!this.flowCore) {
      throw new Error('FlowCore not initialized');
    }

    return this.flowCore;
  }
}
