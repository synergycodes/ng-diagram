import { computed, inject, Injectable } from '@angular/core';
import { MiddlewareChain } from '@angularflow/core';
import { NgDiagramBaseService } from './ng-diagram-base.service';
import { NgDiagramModelService } from './ng-diagram-model.service';

@Injectable()
export class NgDiagramSelectionService<
  TMiddlewares extends MiddlewareChain = [],
> extends NgDiagramBaseService<TMiddlewares> {
  private readonly modelService = inject(NgDiagramModelService);

  /**
   * Returns a computed signal for the current selection
   */
  selection = computed(() => {
    const nodes = this.modelService.nodes().filter((node) => node.selected);
    const edges = this.modelService.edges().filter((edge) => edge.selected);
    return { nodes, edges };
  });

  /**
   * Selects nodes and edges by their IDs.
   * @param nodeIds Array of node IDs to select.
   * @param edgeIds Array of edge IDs to select.
   */
  select(nodeIds: string[] = [], edgeIds: string[] = []) {
    this.flowCore.commandHandler.emit('select', { nodeIds, edgeIds });
  }

  /**
   * Deselects nodes and edges by their IDs.
   * @param nodeIds Array of node IDs to deselect.
   * @param edgeIds Array of edge IDs to deselect.
   */
  deselect(nodeIds: string[] = [], edgeIds: string[] = []) {
    this.flowCore.commandHandler.emit('deselect', { nodeIds, edgeIds });
  }

  /**
   * Deselects all currently selected nodes and edges.
   */
  deselectAll() {
    this.flowCore.commandHandler.emit('deselectAll');
  }

  /**
   * Deletes the current selection
   */
  deleteSelection() {
    this.flowCore.commandHandler.emit('deleteSelection');
  }
}
