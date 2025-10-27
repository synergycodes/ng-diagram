import { computed, inject } from '@angular/core';
import { Node, Point, Rect } from '../../core/src';
import { RendererService } from '../services/renderer/renderer.service';
import { NgDiagramBaseService } from './ng-diagram-base.service';

/**
 * The `NgDiagramViewportService` provides methods and signals for interacting with the diagram viewport.
 *
 * ## Example usage
 * ```typescript
 * private viewportService = inject(NgDiagramViewportService);
 *
 * // Move viewport to (100, 200)
 * this.viewportService.moveViewport(100, 200);
 *
 * // Zoom in by a factor of 1.2
 * this.viewportService.zoom(1.2);
 * ```
 *
 * @category Services
 */
export class NgDiagramViewportService extends NgDiagramBaseService {
  private readonly renderer = inject(RendererService);

  // ===================
  // VIEWPORT SIGNALS
  // ===================

  /**
   * Returns a computed signal for the viewport that safely handles uninitialized state.
   */
  viewport = computed(() => this.renderer.viewport() || { x: 0, y: 0, scale: 1 });

  /**
   * Returns a computed signal for the scale that safely handles uninitialized state.
   */
  scale = computed(() => this.renderer.viewport().scale || 1);

  // ===================
  // POSITION CONVERSION METHODS
  // ===================

  /**
   * Converts a client position to a flow position.
   * @param clientPosition Client position to convert.
   * @returns Flow position.
   */
  clientToFlowPosition(clientPosition: Point): Point {
    return this.flowCore.clientToFlowPosition(clientPosition);
  }

  /**
   * Converts a client position to a position relative to the flow viewport.
   * @param clientPosition Client position.
   * @returns Position on the flow viewport.
   */
  clientToFlowViewportPosition(clientPosition: Point): Point {
    return this.flowCore.clientToFlowViewportPosition(clientPosition);
  }

  /**
   * Converts a flow position to a client position.
   * @param flowPosition Flow position to convert.
   * @returns Client position.
   */
  flowToClientPosition(flowPosition: Point): Point {
    return this.flowCore.flowToClientPosition(flowPosition);
  }

  // ===================
  // VIEWPORT MOVEMENT METHODS
  // ===================

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

  // ===================
  // ZOOM METHODS
  // ===================

  /**
   * Zooms the viewport by the specified factor.
   * @param factor The factor to zoom by.
   * @param center The center point to zoom towards.
   */
  zoom(factor: number, center?: Point | undefined) {
    const x = center?.x || this.viewport().x;
    const y = center?.y || this.viewport().y;
    this.flowCore.commandHandler.emit('zoom', { scale: factor, x, y });
  }

  /**
   * Automatically adjusts the viewport to fit all diagram content (or a specified subset) within the visible area.
   *
   * @param options Optional configuration object
   * @param options.nodeIds Array of node IDs to fit. If not provided, all nodes are included.
   * @param options.edgeIds Array of edge IDs to fit. If not provided, all edges are included.
   * @param options.padding Padding around the content (default: 50). Supports CSS-like syntax:
   *   - Single number: uniform padding on all sides
   *   - [top/bottom, left/right]: vertical and horizontal padding
   *   - [top, left/right, bottom]: top, horizontal, bottom padding
   *   - [top, right, bottom, left]: individual padding for each side
   *
   * @example
   * ```typescript
   * // Fit all nodes and edges with default padding
   * this.viewportService.zoomToFit();
   *
   * // Fit with custom uniform padding
   * this.viewportService.zoomToFit({ padding: 100 });
   *
   * // Fit with different padding on each side [top, right, bottom, left]
   * this.viewportService.zoomToFit({ padding: [50, 100, 50, 100] });
   *
   * // Fit only specific nodes
   * this.viewportService.zoomToFit({ nodeIds: ['node1', 'node2'] });
   * ```
   */
  zoomToFit(options?: {
    nodeIds?: string[];
    edgeIds?: string[];
    padding?: number | [number, number] | [number, number, number] | [number, number, number, number];
  }) {
    this.flowCore.commandHandler.emit('zoomToFit', options ?? {});
  }

  // ===================
  // CENTERING METHODS
  // ===================

  /**
   * Centers the Node within the current viewport bounds.
   * @param nodeOrId The ID of the node or the node object to center on.
   */
  centerOnNode(nodeOrId: string | Node) {
    this.flowCore.commandHandler.emit('centerOnNode', { nodeOrId });
  }

  /**
   * Centers the rectangle within the current viewport bounds.
   * @param rect The rectangle to center on.
   */
  centerOnRect(rect: Rect) {
    this.flowCore.commandHandler.emit('centerOnRect', { rect });
  }
}
