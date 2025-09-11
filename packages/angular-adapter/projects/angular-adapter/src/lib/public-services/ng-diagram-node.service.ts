import { Injectable } from '@angular/core';
import { MiddlewareChain, Node, Point, Port } from '@angularflow/core';
import { NgDiagramBaseService } from './ng-diagram-base.service';

@Injectable()
export class NgDiagramNodeService<
  TMiddlewares extends MiddlewareChain = [],
> extends NgDiagramBaseService<TMiddlewares> {
  // ===================
  // ADD METHODS
  // ===================

  /**
   * Adds ports to a node.
   * @param nodeId The ID of the node to add ports to.
   * @param ports Array of ports to add to the node.
   */
  addPorts(nodeId: string, ports: Port[]) {
    this.flowCore.commandHandler.emit('addPorts', { nodeId, ports });
  }

  // ===================
  // UPDATE METHODS
  // ===================

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
   * Updates ports for a node.
   * @param nodeId The ID of the node to update ports for.
   * @param ports Array of port updates to apply to the node.
   */
  updatePorts(nodeId: string, ports: { portId: string; portChanges: Partial<Port> }[]) {
    this.flowCore.commandHandler.emit('updatePorts', { nodeId, ports });
  }

  // ===================
  // DELETE METHODS
  // ===================

  /**
   * Deletes ports from a node.
   * @param nodeId The ID of the node to delete ports from.
   * @param portIds Array of port IDs to delete from the node.
   */
  deletePorts(nodeId: string, portIds: string[]) {
    this.flowCore.commandHandler.emit('deletePorts', { nodeId, portIds });
  }

  // ===================
  // Z-ORDER METHODS
  // ===================

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
