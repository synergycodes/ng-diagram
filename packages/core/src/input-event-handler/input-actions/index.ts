import type { InputActionName, InputActionWithPredicate } from '../../types';
import { copyAction } from './copy';
import { deleteSelectionAction } from './delete-selection';
import { keyboardMoveSelectionAction } from './keyboard-move-selection';
import { linkingAction } from './linking';
import { panningAction } from './panning';
import { pasteAction } from './paste';
import { pointerMoveSelectionAction } from './pointer-move-selection';
import { selectAction } from './select';

export const inputActions: Record<InputActionName, InputActionWithPredicate> = {
  select: selectAction,
  keyboardMoveSelection: keyboardMoveSelectionAction,
  pointerMoveSelection: pointerMoveSelectionAction,
  panning: panningAction,
  deleteSelection: deleteSelectionAction,
  copy: copyAction,
  paste: pasteAction,
  linking: linkingAction,
};
