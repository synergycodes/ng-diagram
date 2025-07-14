import { type InputActionWithPredicate } from '../../../types';
import { isPointer, isWheel } from '../../../types/event/event.guards';
import { or } from '../input-actions.helpers';
import { handlePointerEvent } from './handle-pointer-event';
import { handleWheelEvent } from './handle-wheel-event';

export const zoomingAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    if (isWheel(event)) {
      handleWheelEvent(event, flowCore);
    } else if (isPointer(event)) {
      handlePointerEvent(event, flowCore);
    }
  },
  predicate: or(isWheel, isPointer),
};
