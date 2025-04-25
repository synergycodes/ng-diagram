import { ActionName, ActionWithPredicate } from '@angularflow/core';
import { moveNodesAction } from './move-nodes';
import { selectAction } from './select';

export const actions: Record<ActionName, ActionWithPredicate> = {
  select: selectAction,
  moveNodes: moveNodesAction,
};
