import { CommandByName, isKeyboardDownEvent, type InputActionWithPredicate, type KeyboardEvent } from '../../types';

export const keyboardMoveSelectionAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    if (!isKeyboardDownEvent(event)) return;

    const nodesToMove = flowCore.modelLookup.getSelectedNodesWithChildren();

    if (nodesToMove.length === 0) return;

    flowCore.commandHandler.emit('moveNodes', { nodes: nodesToMove, ...getMoveNodesCommand(event) });
  },
  predicate: (event) =>
    isKeyboardDownEvent(event) &&
    (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown'),
};

function getMoveNodesCommand(event: KeyboardEvent): Omit<CommandByName<'moveSelection'>, 'name'> {
  const MOVEMENT_STEP = 10;

  switch (event.key) {
    case 'ArrowLeft':
      return { dx: -MOVEMENT_STEP, dy: 0 };
    case 'ArrowRight':
      return { dx: MOVEMENT_STEP, dy: 0 };
    case 'ArrowUp':
      return { dx: 0, dy: -MOVEMENT_STEP };
    case 'ArrowDown':
      return { dx: 0, dy: MOVEMENT_STEP };
    default:
      return { dx: 0, dy: 0 };
  }
}
