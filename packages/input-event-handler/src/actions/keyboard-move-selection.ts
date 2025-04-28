import { ActionWithPredicate, CommandByName, Event, InputEventHandler, KeyboardEvent } from '@angularflow/core';

export const keyboardMoveSelectionAction: ActionWithPredicate = {
  action: (event: Event, inputEventHandler: InputEventHandler) => {
    inputEventHandler.commandHandler.emit('moveSelection', getMoveNodesCommand(event as KeyboardEvent));
  },
  predicate: (event: Event) =>
    event.type === 'keydown' &&
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
