import { isPointerEvent, isWheelEvent, type InputActionWithPredicate } from '../../../types';
import { handlePointerEvent } from './handle-pointer-event';
import { handleWheelEvent } from './handle-wheel-event';

export const zoomingAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    if (isWheelEvent(event)) {
      handleWheelEvent(event, flowCore);
    } else if (isPointerEvent(event)) {
      handlePointerEvent(event, flowCore);
    }
  },
  predicate: (event) => isWheelEvent(event) || isPointerEvent(event),
};
