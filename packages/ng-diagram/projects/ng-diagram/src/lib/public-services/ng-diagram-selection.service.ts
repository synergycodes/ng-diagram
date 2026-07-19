import { computed, inject, Injectable } from '@angular/core';
import { NgDiagramBaseService } from './ng-diagram-base.service';
import { NgDiagramModelService } from './ng-diagram-model.service';

/**
 * The `NgDiagramSelectionService` provides methods for managing the selection state of nodes and edges in the diagram.
 *
 * ## Example usage
 * ```typescript
 * private selectionService = inject(NgDiagramSelectionService);
 *
 * // Select nodes and edges
 * this.selectionService.select(['nodeId1'], ['edgeId1']);
 * ```
 *
 * @public
 * @since 0.8.0
 * @category Services
 */
@Injectable()
export class NgDiagramSelectionService extends NgDiagramBaseService {
  private readonly modelService = inject(NgDiagramModelService);

  /**
   * Returns a computed signal for the current selection of nodes and edges.
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
   * @returns A promise that resolves once the change has been applied to the model. When called inside a transaction, it resolves once the change has been queued on it (applied when the transaction commits).
   */
  select(nodeIds: string[] = [], edgeIds: string[] = []): Promise<void> {
    return this.flowCore.commandHandler.emit('select', { nodeIds, edgeIds });
  }

  /**
   * Deselects nodes and edges by their IDs.
   * @param nodeIds Array of node IDs to deselect.
   * @param edgeIds Array of edge IDs to deselect.
   * @returns A promise that resolves once the change has been applied to the model. When called inside a transaction, it resolves once the change has been queued on it (applied when the transaction commits).
   */
  deselect(nodeIds: string[] = [], edgeIds: string[] = []): Promise<void> {
    return this.flowCore.commandHandler.emit('deselect', { nodeIds, edgeIds });
  }

  /**
   * Deselects all currently selected nodes and edges.
   * @returns A promise that resolves once the change has been applied to the model. When called inside a transaction, it resolves once the change has been queued on it (applied when the transaction commits).
   */
  deselectAll(): Promise<void> {
    return this.flowCore.commandHandler.emit('deselectAll');
  }

  /**
   * Deletes the current selection of nodes and edges.
   * @returns A promise that resolves once the change has been applied to the model. When called inside a transaction, it resolves once the change has been queued on it (applied when the transaction commits).
   */
  deleteSelection(): Promise<void> {
    return this.flowCore.commandHandler.emit('deleteSelection');
  }
}
