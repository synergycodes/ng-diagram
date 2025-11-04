import { Point, Size } from '../../../types';
import { EventHandler } from '../event-handler';
import { KeyboardMoveSelectionEvent } from './keyboard-move-selection.event';

export class KeyboardMoveSelectionEventHandler extends EventHandler<KeyboardMoveSelectionEvent> {
  handle(event: KeyboardMoveSelectionEvent): void {
    const nodesToMove = this.flow.modelLookup.getSelectedNodesWithChildren();
    if (nodesToMove.length === 0) {
      return;
    }

    this.flow.commandHandler.emit('moveNodesBy', { nodes: nodesToMove, delta: this.getDelta(event) });
    this.handleEdgePanning(event, nodesToMove);
  }

  private getDelta(event: KeyboardMoveSelectionEvent): Point {
    const {
      defaultDragSnap: { width: snapWidth, height: snapHeight },
    } = this.flow.config.snapping;

    switch (event.direction) {
      case 'top':
        return { x: 0, y: -snapHeight };
      case 'bottom':
        return { x: 0, y: snapHeight };
      case 'left':
        return { x: -snapWidth, y: 0 };
      case 'right':
        return { x: snapWidth, y: 0 };
      default:
        throw new Error(`Unknown direction: ${event.direction}`);
    }
  }

  private handleEdgePanning(event: KeyboardMoveSelectionEvent, nodes: { position: Point; size?: Size }[]): void {
    const needsPanning = this.checkIfNodesNearEdge(nodes, event.direction);

    if (needsPanning) {
      this.performEdgePan(event.direction);
    }
  }

  private checkIfNodesNearEdge(
    nodes: { position: Point; size?: Size }[],
    direction: KeyboardMoveSelectionEvent['direction']
  ): boolean {
    const threshold = this.flow.config.selectionMoving.edgePanningThreshold;
    const metadata = this.flow.model.getMetadata();
    const { viewport } = metadata;

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
        case 'left':
          return node.position.x <= viewportBounds.left + threshold;
        case 'right':
          return nodeRight >= viewportBounds.right - threshold;
        case 'top':
          return node.position.y <= viewportBounds.top + threshold;
        case 'bottom':
          return nodeBottom >= viewportBounds.bottom - threshold;
        default:
          return false;
      }
    });
  }

  private performEdgePan(direction: KeyboardMoveSelectionEvent['direction']): void {
    const force = this.flow.config.selectionMoving.edgePanningForce;
    let x = 0;
    let y = 0;

    switch (direction) {
      case 'left':
        x = force;
        break;
      case 'right':
        x = -force;
        break;
      case 'top':
        y = force;
        break;
      case 'bottom':
        y = -force;
        break;
    }

    this.flow.commandHandler.emit('moveViewportBy', { x, y });
  }
}
