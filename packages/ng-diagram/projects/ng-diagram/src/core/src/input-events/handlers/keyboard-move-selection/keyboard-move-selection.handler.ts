import { DIRECTIONS, Point, Size, Node } from '../../../types';
import { EventHandler } from '../event-handler';
import { KeyboardMoveSelectionEvent } from './keyboard-move-selection.event';

const UNKNOWN_DIRECTION_ERROR = (direction: string) =>
  `[ngDiagram] Unknown keyboard move direction: "${direction}"

Valid directions are: ${DIRECTIONS.map((d) => `'${d}'`).join(', ')}

This indicates a programming error. Check keyboard shortcut configuration.

Documentation: https://www.ngdiagram.dev/docs/guides/shortcut-manager/
`;

enum Side {
  Top = 'top',
  Bottom = 'bottom',
  Left = 'left',
  Right = 'right',
}

export class KeyboardMoveSelectionEventHandler extends EventHandler<KeyboardMoveSelectionEvent> {
  handle(event: KeyboardMoveSelectionEvent): void {
    const nodesToMove = this.flow.modelLookup.getSelectedNodesWithChildren({ directOnly: false });
    if (nodesToMove.length === 0) {
      return;
    }

    this.flow.commandHandler.emit('moveNodesBy', { nodes: nodesToMove, delta: this.getDelta(event, nodesToMove) });
    this.handleEdgePanning(event, nodesToMove);
  }

  private getDelta(event: KeyboardMoveSelectionEvent, nodes: Node[]): Point {
    const { computeSnapForNodeDrag, defaultDragSnap } = this.flow.config.snapping;
    const { width, height } = computeSnapForNodeDrag(nodes[0]) ?? defaultDragSnap;

    switch (event.direction) {
      case Side.Top:
        return { x: 0, y: -height };
      case Side.Bottom:
        return { x: 0, y: height };
      case Side.Left:
        return { x: -width, y: 0 };
      case Side.Right:
        return { x: width, y: 0 };
      default:
        throw new Error(UNKNOWN_DIRECTION_ERROR(event.direction));
    }
  }

  private handleEdgePanning(event: KeyboardMoveSelectionEvent, nodes: Node[]): void {
    const needsPanning = this.checkIfNodesNearEdge(nodes, event.direction);

    if (needsPanning) {
      this.performEdgePan(event.direction, nodes);
    }
  }

  private checkIfNodesNearEdge(nodes: Node[], direction: KeyboardMoveSelectionEvent['direction']): boolean {
    const metadata = this.flow.model.getMetadata();
    const { viewport } = metadata;
    const { width, height } = this.getFlowThreshold(nodes[0]);

    if (!viewport.width || !viewport.height) {
      return false;
    }

    const viewportBounds = {
      left: -viewport.x / viewport.scale,
      top: -viewport.y / viewport.scale,
      right: (-viewport.x + viewport.width) / viewport.scale,
      bottom: (-viewport.y + viewport.height) / viewport.scale,
    };

    return nodes.some((node) => {
      const nodeRight = node.position.x + (node.size?.width || 100);
      const nodeBottom = node.position.y + (node.size?.height || 50);

      switch (direction) {
        case Side.Left:
          return node.position.x <= viewportBounds.left + width * viewport.scale;
        case Side.Right:
          return nodeRight >= viewportBounds.right - width * viewport.scale;
        case Side.Top:
          return node.position.y <= viewportBounds.top + height * viewport.scale;
        case Side.Bottom:
          return nodeBottom >= viewportBounds.bottom - height * viewport.scale;
        default:
          return false;
      }
    });
  }

  private performEdgePan(direction: KeyboardMoveSelectionEvent['direction'], nodes: Node[]): void {
    const metadata = this.flow.model.getMetadata();
    const { viewport } = metadata;
    const { width, height } = this.getFlowThreshold(nodes[0]);
    let x = 0;
    let y = 0;

    switch (direction) {
      case Side.Left:
        x = width * viewport.scale;
        break;
      case Side.Right:
        x = -width * viewport.scale;
        break;
      case Side.Top:
        y = height * viewport.scale;
        break;
      case Side.Bottom:
        y = -height * viewport.scale;
        break;
    }

    this.flow.commandHandler.emit('moveViewportBy', { x, y });
  }

  private getFlowThreshold(node: Node): Size {
    const { computeSnapForNodeDrag, defaultDragSnap } = this.flow.config.snapping;
    const { edgePanningThreshold } = this.flow.config.selectionMoving;
    const { width, height } = computeSnapForNodeDrag(node) ?? defaultDragSnap;

    return { width: Math.max(width, edgePanningThreshold), height: Math.max(height, edgePanningThreshold) };
  }
}
