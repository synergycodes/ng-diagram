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
