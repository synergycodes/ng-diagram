import {
  isPointer,
  isRotateEvent,
  onRotateHandle,
  ResizeHandleTarget,
  type InputActionWithPredicate,
} from '../../../types';
import { getDistanceBetweenPoints } from '../../../utils/get-distance-between-points';
import { and, targetIs } from '../input-actions.helpers';
import { getRotationAngle } from './get-rotation-angle';

const MIN_DISTANCE_TO_CENTER = 30;

export const rotateAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    if (!isRotateEvent(event)) return;

    const nodeId = (event.target as ResizeHandleTarget).element.id;

    const { mouse, handle, center } = event.data;
    const mouseToCenterDistance = getDistanceBetweenPoints(mouse, center);

    /*
			Someone has a mouse near the center,
			and a movement of a few pixels causes a huge jump in rotation.

      We just ignore that space and do not react.
		*/
    if (mouseToCenterDistance < MIN_DISTANCE_TO_CENTER) return;

    const angle = getRotationAngle({
      handle,
      center,
      mouse,
    });

    flowCore.commandHandler.emit('rotateNodeBy', {
      nodeId,
      angle,
    });
  },
  predicate: and(isRotateEvent, isPointer, targetIs(onRotateHandle)),
};
