import { computed, inject } from '@angular/core';
import { FlowCore, MiddlewareChain } from '@angularflow/core';
import { FlowCoreProviderService } from '../services';

export class NgDiagramViewportService<TMiddlewares extends MiddlewareChain = []> {
  private readonly flowCoreProvider = inject(FlowCoreProviderService<TMiddlewares>);

  private get flowCore(): FlowCore<TMiddlewares> | null {
    try {
      return this.flowCoreProvider.provide();
    } catch {
      return null;
    }
  }

  /**
   * Returns a computed signal for the viewport that safely handles uninitialized state
   */
  getViewport() {
    return computed(() => {
      return this.flowCore?.model.getMetadata().viewport || { x: 0, y: 0, scale: 1 };
    });
  }

  /**
   * Returns a computed signal for the scale that safely handles uninitialized state
   */
  getScale() {
    return computed(() => {
      return this.flowCore?.getScale() || 1;
    });
  }
}
