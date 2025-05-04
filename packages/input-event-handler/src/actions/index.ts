import { ActionName, ActionWithPredicate } from '@angularflow/core';
import { copyAction } from './copy';
import { deleteSelectionAction } from './delete-selection';
import { keyboardMoveSelectionAction } from './keyboard-move-selection';
import { pasteAction } from './paste';
import { pointerMoveSelectionAction } from './pointer-move-selection';
import { selectAction } from './select';

export const actions: Record<ActionName, ActionWithPredicate> = {
  select: selectAction,
  keyboardMoveSelection: keyboardMoveSelectionAction,
  pointerMoveSelection: pointerMoveSelectionAction,
  deleteSelection: deleteSelectionAction,
  copy: copyAction,
  paste: pasteAction,
};
