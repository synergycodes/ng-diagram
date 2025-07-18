import type { InputActionName, InputActionWithPredicate } from '../../types';
import { copyAction } from './copy';
import { cutAction } from './cut';
import { deleteSelectionAction } from './delete-selection';
import { keyboardMoveSelectionAction } from './keyboard-move-selection';
import { linkingAction } from './linking';
import { panningAction } from './panning';
import { pasteAction } from './paste';
import { pointerMoveSelectionAction } from './pointer-move-selection';
import { resizeAction } from './resize/resize';
import { rotateAction } from './rotate/rotate';
import { selectAction } from './select';
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
  cut: cutAction,
};
