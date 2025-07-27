import { inject, Injectable } from '@angular/core';

import { FlowCore, FlowCoreProviderService } from '@angularflow/angular-adapter';
import { AppMiddlewares } from './flow.config';

@Injectable()
export class FlowService {
  private flowCoreProvider = inject(FlowCoreProviderService);

  get flowCore(): FlowCore<AppMiddlewares> {
    return this.flowCoreProvider.provide();
  }
}
