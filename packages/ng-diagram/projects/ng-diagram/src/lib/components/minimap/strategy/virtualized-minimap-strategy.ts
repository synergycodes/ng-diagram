import { inject, Injectable } from '@angular/core';
import { Rect } from '../../../../core/src';
import { NgDiagramModelService } from '../../../public-services/ng-diagram-model.service';
import { calculateBoundsFromPositions } from '../ng-diagram-minimap.calculations';
import { MinimapNodeData, MinimapStrategy } from '../ng-diagram-minimap.types';

/**
 * Minimap strategy for virtualized rendering mode.
 * No nodes are displayed on the minimap — only the viewport frame and diagram bounds outline.
 * Diagram bounds are computed from all model nodes using position and size (not measuredBounds).
 */
@Injectable()
export class VirtualizedMinimapStrategy implements MinimapStrategy {
  private readonly modelService = inject(NgDiagramModelService);

  computeMinimapNodes(): MinimapNodeData[] {
    return [];
  }

  computeDiagramBounds(): Rect {
    return calculateBoundsFromPositions(this.modelService.nodes());
  }
}
