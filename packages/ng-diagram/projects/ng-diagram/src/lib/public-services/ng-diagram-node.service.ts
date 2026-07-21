import { Injectable } from '@angular/core';
import { Node, Point, Size } from '../../core/src';
import { emitWithMeasurementOption } from './emit-with-measurement-option';
import { NgDiagramBaseService } from './ng-diagram-base.service';

/**
 * The `NgDiagramNodeService` provides methods for manipulating nodes in the diagram.
 *
 * ## Example usage
 * ```typescript
 * private nodeService = inject(NgDiagramNodeService);
 *
 * // Move nodes by a delta
 * this.nodeService.moveNodesBy([node1, node2], { x: 10, y: 20 });
 * ```
 *
 * @public
 * @since 0.8.0
 * @category Services
 */
@Injectable()
export class NgDiagramNodeService extends NgDiagramBaseService {
  /**
   * Moves nodes by the specified amounts.
   * @param nodes Array of nodes to move.
   * @param delta The amount to move the nodes by.
   * @returns A promise that resolves once the change has been applied to the model. When called inside a transaction, it resolves once the change has been queued on it (applied when the transaction commits).
   */
  moveNodesBy(nodes: Node[], delta: Point): Promise<void> {
    return this.flowCore.commandHandler.emit('moveNodesBy', { nodes, delta });
  }

  /**
   * Resizes a node to the specified dimensions.
   * `Node.autoSize` must be set to false to resize a node.
   * @param id The ID of the node to resize.
   * @param size The new size of the node.
   * @param position Optional new position of the node.
   * @param disableAutoSize Optional flag to disable auto-sizing.
   * @param options Optional settings. Set `waitForMeasurements: true` to resolve only after
   * measurements triggered by the resize have completed. Available since 1.3.0.
   * @returns A promise that resolves once the change has been applied to the model. When called inside a transaction, it resolves once the change has been queued on it (applied when the transaction commits).
   */
  resizeNode(
    id: string,
    size: Size,
    position?: Point,
    disableAutoSize?: boolean,
    options?: { waitForMeasurements?: boolean }
  ): Promise<void> {
    return emitWithMeasurementOption(this.flowCore, 'resizeNode', { id, size, position, disableAutoSize }, options);
  }

  /**
   * Rotates a node to the specified angle.
   * @param nodeId The ID of the node to rotate.
   * @param angle The rotation angle in degrees.
   * @returns A promise that resolves once the change has been applied to the model. When called inside a transaction, it resolves once the change has been queued on it (applied when the transaction commits).
   */
  rotateNodeTo(nodeId: string, angle: number): Promise<void> {
    return this.flowCore.commandHandler.emit('rotateNodeTo', { nodeId, angle });
  }

  /**
   * Brings the specified nodes and edges to the front (highest z-index).
   * @param nodeIds Array of node IDs to bring to front.
   * @param edgeIds Array of edge IDs to bring to front.
   * @returns A promise that resolves once the change has been applied to the model. When called inside a transaction, it resolves once the change has been queued on it (applied when the transaction commits).
   */
  bringToFront(nodeIds?: string[], edgeIds?: string[]): Promise<void> {
    return this.flowCore.commandHandler.emit('bringToFront', { nodeIds, edgeIds });
  }

  /**
   * Sends the specified nodes and edges to the back (lowest z-index).
   * @param nodeIds Array of node IDs to send to back.
   * @param edgeIds Array of edge IDs to send to back.
   * @returns A promise that resolves once the change has been applied to the model. When called inside a transaction, it resolves once the change has been queued on it (applied when the transaction commits).
   */
  sendToBack(nodeIds?: string[], edgeIds?: string[]): Promise<void> {
    return this.flowCore.commandHandler.emit('sendToBack', { nodeIds, edgeIds });
  }
}
