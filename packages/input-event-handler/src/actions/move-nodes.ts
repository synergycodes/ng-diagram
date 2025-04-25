import { ActionWithPredicate, CommandByName, Event, InputEventHandler, KeyboardEvent } from '@angularflow/core';

export const moveNodesAction: ActionWithPredicate = {
  action: (event: Event, inputEventHandler: InputEventHandler) => {
    if (isKeyboardMoveEvent(event)) {
      inputEventHandler.commandHandler.emit('moveNodes', getMoveNodesCommand(event));
    }
  },
  predicate: (event: Event) => event.type === 'keydown',
};

function getMoveNodesCommand(event: KeyboardEvent): Omit<CommandByName<'moveNodes'>, 'name'> {
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

function isKeyboardMoveEvent(event: Event): event is KeyboardEvent {
  return (
    event.type === 'keydown' &&
    (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown')
  );
}
