import { inject, Injectable } from '@angular/core';
import { Rect } from '../../../../core/src';
import { calculatePartsBounds } from '../../../../core/src/utils/dimensions';
import { RendererService } from '../../../services/renderer/renderer.service';
import { extractNodeBounds } from '../ng-diagram-minimap.calculations';
import {
  MinimapNodeData,
  MinimapNodeStyleFn,
  MinimapStrategy,
  NgDiagramMinimapNodeTemplateMap,
} from '../ng-diagram-minimap.types';
import { MinimapNodeCache } from './minimap-node-cache';

/**
 * Minimap strategy for direct (non-virtualized) rendering mode.
 * All rendered nodes are displayed on the minimap.
 * Diagram bounds are computed from rendered nodes using measuredBounds.
 */
@Injectable()
export class DirectMinimapStrategy implements MinimapStrategy {
  private readonly renderer = inject(RendererService);
  private readonly cache = new MinimapNodeCache();
  private lastStyleFn: MinimapNodeStyleFn | undefined;
  private lastTemplateMap: NgDiagramMinimapNodeTemplateMap | undefined;

  computeMinimapNodes(
    styleFn: MinimapNodeStyleFn | undefined,
    templateMap: NgDiagramMinimapNodeTemplateMap
  ): MinimapNodeData[] {
    this.invalidateCacheIfNeeded(styleFn, templateMap);

    return this.renderer.nodes().map((node) =>
      this.cache.getOrCompute(node, () => ({
        bounds: extractNodeBounds(node),
        diagramNode: node,
        nodeStyle: styleFn?.(node) ?? {},
        template: node.type ? (templateMap.get(node.type) ?? null) : null,
      }))
    );
  }

  computeDiagramBounds(): Rect {
    return calculatePartsBounds(this.renderer.nodes(), []);
  }

  private invalidateCacheIfNeeded(
    styleFn: MinimapNodeStyleFn | undefined,
    templateMap: NgDiagramMinimapNodeTemplateMap
  ): void {
    if (styleFn !== this.lastStyleFn || templateMap !== this.lastTemplateMap) {
      this.cache.clear();
      this.lastStyleFn = styleFn;
      this.lastTemplateMap = templateMap;
    }
  }
}
