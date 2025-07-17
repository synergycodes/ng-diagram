// MIGRATED TO NEW INPUT ACTIONS

import {
  isContinue,
  isEnd,
  isPointer,
  isStart,
  onResizeHandle,
  withPrimaryButton,
  type InputActionWithPredicate,
} from '../../../types';
import { and, or, targetIs } from '../input-actions.helpers';
import { handlePointerEvent } from './handle-pointer-event';

export const resizeAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    if (isPointer(event)) {
      handlePointerEvent(flowCore, event);
      return;
    }
  },
  predicate: and(
    isPointer,
    or(and(isStart, targetIs(onResizeHandle), withPrimaryButton), isContinue, and(isEnd, withPrimaryButton))
  ),
};
