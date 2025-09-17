import { inject } from '@angular/core';
import { FlowCore } from '../../core/src';
import { FlowCoreProviderService } from '../services';

/**
 * Base service class providing access to the FlowCore instance.
 *
 * @internal
 */
export abstract class NgDiagramBaseService {
  protected readonly flowCoreProvider = inject(FlowCoreProviderService);

  protected get flowCore(): FlowCore {
    return this.flowCoreProvider.provide();
  }
}
