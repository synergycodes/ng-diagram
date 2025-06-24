import { CommandByName, isKeyboardDownEvent, type InputActionWithPredicate, type KeyboardEvent } from '../../types';

export const keyboardMoveSelectionAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    if (!isKeyboardDownEvent(event)) return;

    const nodesToMove = flowCore.modelLookup.getSelectedNodesWithChildren();

    if (nodesToMove.length === 0) return;

    flowCore.commandHandler.emit('moveNodesBy', { nodes: nodesToMove, delta: getMoveNodesCommandDelta(event) });
  },
  predicate: (event) =>
    isKeyboardDownEvent(event) &&
    (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown'),
};

function getMoveNodesCommandDelta(event: KeyboardEvent): CommandByName<'moveNodesBy'>['delta'] {
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
