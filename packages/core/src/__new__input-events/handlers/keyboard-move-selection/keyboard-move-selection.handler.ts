import { Point } from '../../../types';
import { __NEW__EventHandler } from '../event-hander';
import { __NEW__KeyboardMoveSelectionEvent } from './keyboard-move-selection.event';

export class KeyboardMoveSelectionHandler extends __NEW__EventHandler<__NEW__KeyboardMoveSelectionEvent> {
  handle(event: __NEW__KeyboardMoveSelectionEvent): void {
    const nodesToMove = this.flow.modelLookup.getSelectedNodesWithChildren();
    if (nodesToMove.length === 0) {
      return;
    }

    this.flow.commandHandler.emit('moveNodesBy', { nodes: nodesToMove, delta: this.getDelta(event) });
  }

  private getDelta(event: __NEW__KeyboardMoveSelectionEvent): Point {
    const MOVEMENT_STEP = 10;

    switch (event.direction) {
      case 'top':
        return { x: 0, y: -MOVEMENT_STEP };
      case 'bottom':
        return { x: 0, y: MOVEMENT_STEP };
      case 'left':
        return { x: -MOVEMENT_STEP, y: 0 };
      case 'right':
        return { x: MOVEMENT_STEP, y: 0 };
      default:
        throw new Error(`Unknown direction: ${event.direction}`);
    }
  }
}
