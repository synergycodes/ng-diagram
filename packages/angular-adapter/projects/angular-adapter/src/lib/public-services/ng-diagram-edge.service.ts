import { Injectable } from '@angular/core';
import { EdgeLabel, MiddlewareChain } from '@angularflow/core';
import { NgDiagramBaseService } from './ng-diagram-base.service';

@Injectable()
export class NgDiagramEdgeService<
  TMiddlewares extends MiddlewareChain = [],
> extends NgDiagramBaseService<TMiddlewares> {
  /**
   * Adds labels to an edge.
   * @param edgeId The ID of the edge to add labels to.
   * @param labels The labels to add to the edge.
   */
  addEdgeLabels(edgeId: string, labels: EdgeLabel[]) {
    this.flowCore.commandHandler.emit('addEdgeLabels', { edgeId, labels });
  }

  /**
   * Updates a label on an edge.
   * @param edgeId The ID of the edge to update the label on.
   * @param labelId The ID of the label to update.
   * @param labelChanges The changes to apply to the label.
   */
  updateEdgeLabel(edgeId: string, labelId: string, labelChanges: Partial<EdgeLabel>) {
    this.flowCore.commandHandler.emit('updateEdgeLabel', { edgeId, labelId, labelChanges });
  }

  /**
   * Deletes labels from an edge.
   * @param edgeId The ID of the edge to delete labels from.
   * @param labelIds The IDs of the labels to delete.
   */
  deleteEdgeLabels(edgeId: string, labelIds: string[]) {
    this.flowCore.commandHandler.emit('deleteEdgeLabels', { edgeId, labelIds });
  }
}
