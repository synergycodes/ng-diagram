import { NgDiagramMath } from '../../../math';
import { Bounds, Direction, DIRECTIONS, Node, Point } from '../../../types';
import { getRotatedBoundingRect } from '../../../utils';
import { EventHandler } from '../event-handler';
import { KeyboardMoveSelectionEvent } from './keyboard-move-selection.event';

/** @internal */
export const UNKNOWN_DIRECTION_ERROR = (direction: string) =>
  `[ngDiagram] Unknown keyboard move direction: "${direction}"

Valid directions are: ${DIRECTIONS.map((d) => `'${d}'`).join(', ')}

This indicates a programming error. Check keyboard shortcut configuration.

Documentation: https://www.ngdiagram.dev/docs/guides/shortcut-manager/
`;

const DIRECTION_VECTORS: Record<Direction, Point> = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export class KeyboardMoveSelectionEventHandler extends EventHandler<KeyboardMoveSelectionEvent> {
  handle(event: KeyboardMoveSelectionEvent): void {
    const nodesToMove = this.flow.modelLookup
      .getSelectedNodesWithChildren({ directOnly: false })
      .filter((node) => node.draggable ?? true);
    if (nodesToMove.length === 0) {
      return;
    }

    const rootNodes = this.getRootNodes(nodesToMove);
    const delta = this.getDelta(event.direction, rootNodes);
    this.flow.commandHandler.emit('moveNodesBy', { nodes: nodesToMove, delta });
    if (this.flow.config.viewportPanningEnabled) {
      this.panViewportIfNeeded(event.direction, nodesToMove, delta);
    }
  }

  private getRootNodes(nodes: Node[]): Node[] {
    const nodeIds = new Set(nodes.map((node) => node.id));
    return nodes.filter((node) => node.groupId == null || !nodeIds.has(node.groupId));
  }

  private getDelta(direction: Direction, rootNodes: Node[]): Point {
    const { computeSnapForNodeDrag, defaultDragSnap } = this.flow.config.snapping;

    const maxSnap = rootNodes.reduce(
      (max, node) => {
        const { width, height } = computeSnapForNodeDrag(node) ?? defaultDragSnap;
        return { width: Math.max(max.width, width), height: Math.max(max.height, height) };
      },
      { width: 0, height: 0 }
    );

    const vector = DIRECTION_VECTORS[direction];
    if (!vector) {
      throw new Error(UNKNOWN_DIRECTION_ERROR(direction));
    }

    return {
      x: vector.x * maxSnap.width,
      y: vector.y * maxSnap.height,
    };
  }

  private panViewportIfNeeded(direction: Direction, nodes: Node[], delta: Point): void {
    const panAmount = this.calculatePanAmount(direction, nodes, delta);
    if (panAmount > 0) {
      this.emitViewportPan(direction, panAmount);
    }
  }

  private calculatePanAmount(direction: Direction, nodes: Node[], delta: Point): number {
    const { viewport } = this.flow.model.getMetadata();
    if (!viewport.width || !viewport.height) {
      return 0;
    }

    const viewportBounds = this.getViewportBounds(
      viewport.x,
      viewport.y,
      viewport.width,
      viewport.height,
      viewport.scale
    );

    return nodes.reduce((maxOverflow, node) => {
      const overflow = this.calculateNodeOverflow(node, delta, direction, viewportBounds);
      return Math.max(maxOverflow, overflow);
    }, 0);
  }

  private getViewportBounds(x: number, y: number, width: number, height: number, scale: number): Bounds {
    const { edgePanningThreshold } = this.flow.config.selectionMoving;
    const threshold = edgePanningThreshold / scale;

    return {
      left: -x / scale + threshold,
      top: -y / scale + threshold,
      right: (-x + width) / scale - threshold,
      bottom: (-y + height) / scale - threshold,
    };
  }

  private calculateNodeOverflow(node: Node, delta: Point, direction: Direction, bounds: Bounds): number {
    const snappedPosition = this.getSnappedPosition(node, delta);
    const nodeBounds = this.getNodeBounds(node, snappedPosition);

    switch (direction) {
      case 'left':
        return bounds.left - nodeBounds.left;
      case 'right':
        return nodeBounds.right - bounds.right;
      case 'top':
        return bounds.top - nodeBounds.top;
      case 'bottom':
        return nodeBounds.bottom - bounds.bottom;
    }
  }

  private getNodeBounds(node: Node, newPosition: Point): Bounds {
    const width = node.size?.width ?? 100;
    const height = node.size?.height ?? 50;
    const rect = { x: newPosition.x, y: newPosition.y, width, height };
    const boundingRect = getRotatedBoundingRect(rect, node.angle ?? 0);

    return {
      left: boundingRect.x,
      top: boundingRect.y,
      right: boundingRect.x + boundingRect.width,
      bottom: boundingRect.y + boundingRect.height,
    };
  }

  private getSnappedPosition(node: Node, delta: Point): Point {
    const { shouldSnapDragForNode, computeSnapForNodeDrag, defaultDragSnap } = this.flow.config.snapping;
    const newPosition = { x: node.position.x + delta.x, y: node.position.y + delta.y };

    if (!shouldSnapDragForNode(node)) {
      return newPosition;
    }

    return NgDiagramMath.snapPoint(newPosition, computeSnapForNodeDrag(node) ?? defaultDragSnap);
  }

  private emitViewportPan(direction: Direction, amount: number): void {
    const { viewport } = this.flow.model.getMetadata();
    const screenAmount = amount * viewport.scale;
    const vector = DIRECTION_VECTORS[direction];

    this.flow.commandHandler.emit('moveViewportBy', {
      x: vector.x === 0 ? 0 : -vector.x * screenAmount,
      y: vector.y === 0 ? 0 : -vector.y * screenAmount,
    });
  }
}
