import { Injectable } from '@angular/core';
import { Node, Point } from '../../core/src';
import { NgDiagramBaseService } from './ng-diagram-base.service';

@Injectable()
export class NgDiagramNodeService extends NgDiagramBaseService {
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
   * @param position Optional new position of the node.
   * @param disableAutoSize Optional flag to disable auto-sizing.
   */
  resizeNode(id: string, size: { width: number; height: number }, position?: Point, disableAutoSize?: boolean) {
    this.flowCore.commandHandler.emit('resizeNode', { id, size, position, disableAutoSize });
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
