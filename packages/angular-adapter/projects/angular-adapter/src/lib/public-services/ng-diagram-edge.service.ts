import { Injectable } from '@angular/core';
import { EdgeLabel, LabelUpdate, MiddlewareChain } from '@angularflow/core';
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
   * @param edgeId The ID of the edge to update the labels on.
   * @param labelUpdates The changes to apply to the labels.
   */
  updateEdgeLabels(edgeId: string, labelUpdates: LabelUpdate[]) {
    this.flowCore.commandHandler.emit('updateEdgeLabels', { edgeId, labelUpdates });
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
