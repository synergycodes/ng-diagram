import {
  isNodeTarget,
  isPointerDownEvent,
  isPointerEvent,
  isPointerMoveEvent,
  isPointerUpEvent,
  isResizeEvent,
  isResizeHandleTarget,
  type InputActionWithPredicate,
} from '../../../types';
import { handlePointerEvent } from './handle-pointer-event';
import { handleResizeEvent } from './handle-resize-event';

export const resizeAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    if (isPointerEvent(event)) {
      handlePointerEvent(flowCore, event);
      return;
    } else if (isResizeEvent(event)) {
      handleResizeEvent(flowCore, event);
    }
  },
  predicate: (event) =>
    (isResizeEvent(event) && isNodeTarget(event.target)) ||
    (isPointerDownEvent(event) && isResizeHandleTarget(event.target) && event.button === 0) ||
    isPointerMoveEvent(event) ||
    (isPointerUpEvent(event) && event.button === 0),
};
