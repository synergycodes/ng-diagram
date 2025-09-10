import { inject, Injectable } from '@angular/core';
import { FlowCore, MiddlewareChain, Node, Point } from '@angularflow/core';
import { FlowCoreProviderService } from '../services';

@Injectable()
export class NgDiagramNodeService<TMiddlewares extends MiddlewareChain = []> {
  private readonly flowCoreProvider = inject(FlowCoreProviderService<TMiddlewares>);

  private get flowCore(): FlowCore<TMiddlewares> {
    return this.flowCoreProvider.provide();
  }

  /**
   * Moves nodes by the specified amounts.
   * @param nodes Array of nodes to move.
   * @param delta The amount to move the nodes by.
   */
  moveNodesBy(nodes: Node[], delta: Point) {
    this.flowCore.commandHandler.emit('moveNodesBy', { nodes, delta });
  }

  /**
   * Resizes a node to the specified dimensions.
   * @param id The ID of the node to resize.
   * @param size The new size of the node.
   */
  resizeNode(id: string, size: { width: number; height: number }) {
    this.flowCore.commandHandler.emit('resizeNode', { id, size });
  }

  /**
   * Rotates a node to the specified angle.
   * @param nodeId The ID of the node to rotate.
   * @param angle The rotation angle in degrees.
   */
  rotateNodeTo(nodeId: string, angle: number) {
    this.flowCore.commandHandler.emit('rotateNodeTo', { nodeId, angle });
  }

  /**
   * Brings the specified nodes to the front (highest z-index).
   * @param nodeIds Array of node IDs to bring to front.
   * @param edgeIds Array of edge IDs to bring to front.
   */
  bringToFront(nodeIds?: string[], edgeIds?: string[]) {
    this.flowCore.commandHandler.emit('bringToFront', { nodeIds, edgeIds });
  }

  /**
   * Sends the specified nodes to the back (lowest z-index).
   * @param nodeIds Array of node IDs to send to back.
   * @param edgeIds Array of edge IDs to send to back.
   */
  sendToBack(nodeIds?: string[], edgeIds?: string[]) {
    this.flowCore.commandHandler.emit('sendToBack', { nodeIds, edgeIds });
  }
}
