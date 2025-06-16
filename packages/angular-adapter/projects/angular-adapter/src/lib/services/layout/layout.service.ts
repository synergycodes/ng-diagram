import { inject, Injectable } from '@angular/core';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly flowCore = inject(FlowCoreProviderService);

  configureTreeLayout() {
    this.flowCore.provide().treeLayout();
  }
}
