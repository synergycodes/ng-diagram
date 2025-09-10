import { inject, Injectable } from '@angular/core';
import { FlowCore, MiddlewareChain, Node } from '@angularflow/core';
import { FlowCoreProviderService } from '../services';

@Injectable()
export class NgDiagramGroupsService<TMiddlewares extends MiddlewareChain = []> {
  private readonly flowCoreProvider = inject(FlowCoreProviderService<TMiddlewares>);

  private get flowCore(): FlowCore<TMiddlewares> {
    return this.flowCoreProvider.provide();
  }

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
}
