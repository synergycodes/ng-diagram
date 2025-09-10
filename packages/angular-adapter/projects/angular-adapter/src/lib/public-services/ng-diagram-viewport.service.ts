import { computed, inject } from '@angular/core';
import { MiddlewareChain } from '@angularflow/core';
import { FlowCoreProviderService } from '../services';
import { NgDiagramModelService } from './ng-diagram-model.service';

export class NgDiagramViewportService<TMiddlewares extends MiddlewareChain = []> {
  private readonly flowCoreProvider = inject(FlowCoreProviderService<TMiddlewares>);
  private readonly modelService = inject(NgDiagramModelService);

  /**
   * Returns a computed signal for the viewport that safely handles uninitialized state
   */
  viewport = computed(() => this.modelService.metadata().viewport || { x: 0, y: 0, scale: 1 });

  /**
   * Returns a computed signal for the scale that safely handles uninitialized state
   */
  scale = computed(() => this.modelService.metadata().viewport.scale || 1);
}
