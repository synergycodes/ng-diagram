import { inject, Injectable } from '@angular/core';
import { FlowCore } from '@angularflow/core';
import { InputEventHandler } from '@angularflow/input-event-handler';

import { EventMapperService } from '../event-mapper/event-mapper.service';
import { ModelProviderService } from '../model-provider/model-provider.service';
import { RendererService } from '../renderer/renderer.service';
import { detectEnvironment } from './detect-environment';

@Injectable({ providedIn: 'root' })
export class FlowCoreProviderService {
  private readonly modelProvider = inject(ModelProviderService);
  private readonly renderer = inject(RendererService);
  private readonly eventMapper = inject(EventMapperService);
  private flowCore: FlowCore | null = null;

  init(): void {
    this.flowCore = new FlowCore(
      this.modelProvider.provide(),
      this.renderer,
      this.eventMapper,
      (commandHandler, eventMapper, environment) => new InputEventHandler(commandHandler, eventMapper, environment),
      detectEnvironment()
    );
  }

  provide(): FlowCore {
    if (!this.flowCore) {
      throw new Error('FlowCore not initialized');
    }

    return this.flowCore;
  }
}
