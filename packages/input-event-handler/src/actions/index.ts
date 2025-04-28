import { ActionName, ActionWithPredicate } from '@angularflow/core';
import { keyboardMmoveNodesAction } from './keyboard-move-selection';
import { selectAction } from './select';

export const actions: Record<ActionName, ActionWithPredicate> = {
  select: selectAction,
  moveNodes: keyboardMmoveNodesAction,
};
