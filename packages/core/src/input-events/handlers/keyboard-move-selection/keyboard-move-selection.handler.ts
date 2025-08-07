import { Point } from '../../../types';
import { EventHandler } from '../event-hander';
import { KeyboardMoveSelectionEvent } from './keyboard-move-selection.event';

export class KeyboardMoveSelectionEventHandler extends EventHandler<KeyboardMoveSelectionEvent> {
  handle(event: KeyboardMoveSelectionEvent): void {
    const nodesToMove = this.flow.modelLookup.getSelectedNodesWithChildren();
    if (nodesToMove.length === 0) {
      return;
    }

    this.flow.commandHandler.emit('moveNodesBy', { nodes: nodesToMove, delta: this.getDelta(event) });
  }

  private getDelta(event: KeyboardMoveSelectionEvent): Point {
    const {
      defaultDragSnap: { x: snapX, y: snapY },
    } = this.flow.config.snapping;

    switch (event.direction) {
      case 'top':
        return { x: 0, y: -snapY };
      case 'bottom':
        return { x: 0, y: snapY };
      case 'left':
        return { x: -snapX, y: 0 };
      case 'right':
        return { x: snapX, y: 0 };
      default:
        throw new Error(`Unknown direction: ${event.direction}`);
    }
  }
}
