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

/**
 * Minimap strategy for direct (non-virtualized) rendering mode.
 * All rendered nodes are displayed on the minimap.
 * Diagram bounds are computed from rendered nodes using measuredBounds.
 */
@Injectable()
export class DirectMinimapStrategy implements MinimapStrategy {
  private readonly renderer = inject(RendererService);

  computeMinimapNodes(
    styleFn: MinimapNodeStyleFn | undefined,
    templateMap: NgDiagramMinimapNodeTemplateMap
  ): MinimapNodeData[] {
    const nodes = this.renderer.nodes();
    return nodes.map((node) => ({
      bounds: extractNodeBounds(node),
      diagramNode: node,
      nodeStyle: styleFn?.(node) ?? {},
      template: node.type ? (templateMap.get(node.type) ?? null) : null,
    }));
  }

  computeDiagramBounds(): Rect {
    return calculatePartsBounds(this.renderer.nodes(), []);
  }
}
