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
   * @returns A promise that resolves once the change has been applied to the model. When called inside a transaction, it resolves once the change has been queued on it (applied when the transaction commits).
   */
  addToGroup(groupId: string, nodeIds: string[]): Promise<void> {
    return this.flowCore.commandHandler.emit('addToGroup', { groupId, nodeIds });
  }

  /**
   * Highlights a group.
   * @param groupId The ID of the group to highlight.
   * @param nodes The nodes to highlight as part of the group.
   * @returns A promise that resolves once the change has been applied.
   */
  highlightGroup(groupId: string, nodes: Node[]): Promise<void> {
    return this.flowCore.commandHandler.emit('highlightGroup', { groupId, nodes });
  }

  /**
   * Clears all group highlights.
   * @returns A promise that resolves once the change has been applied.
   */
  highlightGroupClear(): Promise<void> {
    return this.flowCore.commandHandler.emit('highlightGroupClear');
  }

  /**
   * Removes nodes from a group.
   * @param groupId The ID of the group to remove nodes from.
   * @param nodeIds Array of node IDs to remove from the group.
   * @returns A promise that resolves once the change has been applied to the model. When called inside a transaction, it resolves once the change has been queued on it (applied when the transaction commits).
   */
  removeFromGroup(groupId: string, nodeIds: string[]): Promise<void> {
    return this.flowCore.commandHandler.emit('removeFromGroup', { groupId, nodeIds });
  }
}
