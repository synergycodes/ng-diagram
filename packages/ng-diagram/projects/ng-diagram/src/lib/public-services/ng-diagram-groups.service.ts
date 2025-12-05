import { Injectable } from '@angular/core';
import { Node } from '../../core/src';
import { NgDiagramBaseService } from './ng-diagram-base.service';

/**
 * The `NgDiagramGroupsService` provides methods for managing node groups in the diagram.
 *
 * ## Example usage
 * ```typescript
 * private groupsService = inject(NgDiagramGroupsService);
 *
 * // Add nodes to a group
 * this.groupsService.addToGroup('groupId', ['nodeId1', 'nodeId2']);
 * ```
 *
 * @public
 * @since 0.8.0
 * @category Services
 */
@Injectable()
export class NgDiagramGroupsService extends NgDiagramBaseService {
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
