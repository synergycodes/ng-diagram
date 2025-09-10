import { computed, inject } from '@angular/core';
import { FlowCore, MiddlewareChain } from '@angularflow/core';
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

  private get flowCore(): FlowCore<TMiddlewares> {
    return this.flowCoreProvider.provide();
  }

  /**
   * Moves the viewport to the specified coordinates.
   * @param x The x-coordinate to move the viewport to.
   * @param y The y-coordinate to move the viewport to.
   */
  moveViewport(x: number, y: number) {
    this.flowCore.commandHandler.emit('moveViewport', { x, y });
  }

  /**
   * Moves the viewport by the specified amounts.
   * @param dx The amount to move the viewport in the x-direction.
   * @param dy The amount to move the viewport in the y-direction.
   */
  moveViewportBy(dx: number, dy: number) {
    this.flowCore.commandHandler.emit('moveViewportBy', { x: dx, y: dy });
  }

  /**
   * Zooms the viewport by the specified factor.
   * @param factor The factor to zoom by.
   * @param center The center point to zoom towards.
   */
  zoom(factor: number, center?: { x: number; y: number } | undefined) {
    const x = center?.x || this.viewport().x;
    const y = center?.y || this.viewport().y;
    this.flowCore.commandHandler.emit('zoom', { scale: factor, x, y });
  }
}
