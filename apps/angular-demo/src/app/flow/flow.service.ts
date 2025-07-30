import { inject, Injectable } from '@angular/core';

import { AppMiddlewares, FlowCore, FlowCoreProviderService } from '@angularflow/angular-adapter';

@Injectable()
export class FlowService {
  private flowCoreProvider = inject(FlowCoreProviderService);

  get flowCore(): FlowCore<AppMiddlewares> {
    return this.flowCoreProvider.provide();
  }
}
