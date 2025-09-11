import { inject } from '@angular/core';
import { FlowCore, MiddlewareChain } from '@angularflow/core';
import { FlowCoreProviderService } from '../services';

export abstract class NgDiagramBaseService<TMiddlewares extends MiddlewareChain = []> {
  protected readonly flowCoreProvider = inject(FlowCoreProviderService<TMiddlewares>);

  protected get flowCore(): FlowCore<TMiddlewares> {
    return this.flowCoreProvider.provide();
  }
}
