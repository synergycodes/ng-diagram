import { inject } from '@angular/core';
import { FlowCore } from '@ng-diagram/core';
import { FlowCoreProviderService } from '../services';

export abstract class NgDiagramBaseService {
  protected readonly flowCoreProvider = inject(FlowCoreProviderService);

  protected get flowCore(): FlowCore {
    return this.flowCoreProvider.provide();
  }
}
