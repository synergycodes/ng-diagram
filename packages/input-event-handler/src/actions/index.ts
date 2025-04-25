import { ActionName, ActionWithPredicate } from '@angularflow/core';
import { selectAction } from './select';

export const actions: Record<ActionName, ActionWithPredicate> = {
  select: selectAction,
};
