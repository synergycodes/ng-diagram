import {
  isRotateEvent,
  isRotateHandleTarget,
  ResizeHandleTarget,
  RotateEvent,
  type InputActionWithPredicate,
} from '../../../types';
import { getDistanceBetweenPoints } from '../../../utils/get-distance-between-points';
import { getRotationAngle } from './get-rotation-angle';

const MIN_DISTANCE_TO_CENTER = 30;

export const rotateAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    const { mouse, handle, center, target, ports } = event as RotateEvent;
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
      ports: ports.map((port) => ({ portId: port.id, portChanges: { position: port.position } })),
    });
  },
  predicate: (event) => isRotateHandleTarget(event.target) && isRotateEvent(event),
};
