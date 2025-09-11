import { Injectable } from '@angular/core';
import { MiddlewareChain, Node } from '@angularflow/core';
import { NgDiagramBaseService } from './ng-diagram-base.service';

@Injectable()
export class NgDiagramGroupsService<
  TMiddlewares extends MiddlewareChain = [],
> extends NgDiagramBaseService<TMiddlewares> {
  /**
   * Adds nodes to a group.
   * @param groupId The ID of the group to add nodes to.
   * @param nodeIds Array of node IDs to add to the group.
   */
  addToGroup(groupId: string, nodeIds: string[]) {
    this.flowCore.commandHandler.emit('addToGroup', { groupId, nodeIds });
  }

  /**
   * Highlights a group.
   * @param groupId The ID of the group to highlight.
   * @param nodes The nodes to highlight as part of the group.
   */
  highlightGroup(groupId: string, nodes: Node[]) {
    this.flowCore.commandHandler.emit('highlightGroup', { groupId, nodes });
  }

  /**
   * Clears all group highlights.
   */
  highlightGroupClear() {
    this.flowCore.commandHandler.emit('highlightGroupClear');
  }

  /**
   * Removes nodes from a group.
   * @param groupId The ID of the group to remove nodes from.
   * @param nodeIds Array of node IDs to remove from the group.
   */
  removeFromGroup(groupId: string, nodeIds: string[]) {
    this.flowCore.commandHandler.emit('removeFromGroup', { groupId, nodeIds });
  }
}
