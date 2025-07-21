import {
  isRotateEvent,
  isRotateHandleTarget,
  ResizeHandleTarget,
  RotateEvent,
  type InputActionWithPredicate,
} from '../../../types';
import { getDistanceBetweenPoints } from '../../../utils';
import { getRotationAngle } from './get-rotation-angle';

const MIN_DISTANCE_TO_CENTER = 30;

export const rotateAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    const { mouse, handle, center, target } = event as RotateEvent;
    const nodeId = (target as ResizeHandleTarget).element.id;

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
  predicate: (event) => isRotateHandleTarget(event.target) && isRotateEvent(event),
};
