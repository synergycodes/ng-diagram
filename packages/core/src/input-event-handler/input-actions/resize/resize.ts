import {
  isPointerDownEvent,
  isPointerEvent,
  isPointerMoveEvent,
  isPointerUpEvent,
  isResizeHandleTarget,
  type InputActionWithPredicate,
} from '../../../types';
import { handlePointerEvent } from './handle-pointer-event';

export const resizeAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    if (isPointerEvent(event)) {
      handlePointerEvent(flowCore, event);
      return;
    }
  },
  predicate: (event) =>
    (isPointerDownEvent(event) && isResizeHandleTarget(event.target) && event.button === 0) ||
    isPointerMoveEvent(event) ||
    (isPointerUpEvent(event) && event.button === 0),
};
