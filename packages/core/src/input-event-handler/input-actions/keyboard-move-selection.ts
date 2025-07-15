import { CommandByName, type InputActionWithPredicate } from '../../types';
import { isArrowKey, isKeyboard } from '../../types/__old__event/event.guards';
import { __OLD__InputEvent, KeyboardInputEvent } from '../../types/__old__event/event.interface';

export const keyboardMoveSelectionAction: InputActionWithPredicate = {
  action: (event: __OLD__InputEvent, flowCore) => {
    if (!isKeyboard(event)) return;
    const nodesToMove = flowCore.modelLookup.getSelectedNodesWithChildren();

    if (nodesToMove.length === 0) return;

    flowCore.commandHandler.emit('moveNodesBy', { nodes: nodesToMove, delta: getMoveNodesCommandDelta(event) });
  },
  predicate: isArrowKey,
};

function getMoveNodesCommandDelta(event: KeyboardInputEvent): CommandByName<'moveNodesBy'>['delta'] {
  const MOVEMENT_STEP = 10;

  switch (event.key) {
    case 'ArrowLeft':
      return { x: -MOVEMENT_STEP, y: 0 };
    case 'ArrowRight':
      return { x: MOVEMENT_STEP, y: 0 };
    case 'ArrowUp':
      return { x: 0, y: -MOVEMENT_STEP };
    case 'ArrowDown':
      return { x: 0, y: MOVEMENT_STEP };
    default:
      return { x: 0, y: 0 };
  }
}
