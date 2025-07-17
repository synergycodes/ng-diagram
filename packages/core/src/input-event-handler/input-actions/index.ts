import type { InputActionName, InputActionWithPredicate } from '../../types';
import { keyboardMoveSelectionAction } from './__migrated__keyboard-move-selection';
import { panningAction } from './__migrated__panning';
import { pointerMoveSelectionAction } from './__migrated__pointer-move-selection';
import { resizeAction } from './__migrated__resize/resize';
import { selectAction } from './__migrated__select';
import { copyAction } from './copy';
import { deleteSelectionAction } from './delete-selection';
import { linkingAction } from './linking';
import { pasteAction } from './paste';
import { rotateAction } from './rotate/rotate';
import { zoomingAction } from './zooming/zooming';

export const inputActions: Record<InputActionName, InputActionWithPredicate> = {
  select: selectAction,
  keyboardMoveSelection: keyboardMoveSelectionAction,
  pointerMoveSelection: pointerMoveSelectionAction,
  panning: panningAction,
  deleteSelection: deleteSelectionAction,
  copy: copyAction,
  paste: pasteAction,
  linking: linkingAction,
  resize: resizeAction,
  zooming: zoomingAction,
  rotate: rotateAction,
};
