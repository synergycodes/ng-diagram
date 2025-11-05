import { Point, Rect } from '../../types';
import { clamp } from '../clamp/clamp';

export const calculateEdgePanningForce = (
  containerBox: Rect,
  clientPosition: Point,
  detectionThreshold: number,
  forceMultiplier: number
): Point | null => {
  const { x: containerX, y: containerY, width: containerWidth, height: containerHeight } = containerBox;
  const { x: clientX, y: clientY } = clientPosition;
  let deltaX = 0;
  let deltaY = 0;

  const deltaLeft = clientX - containerX;
  const deltaRight = containerX + containerWidth - clientX;
  const deltaTop = clientY - containerY;
  const deltaBottom = containerY + containerHeight - clientY;

  if (deltaLeft < detectionThreshold) {
    deltaX = clamp({ min: 0, max: detectionThreshold, value: -(deltaLeft - detectionThreshold) });
  } else if (deltaRight < detectionThreshold) {
    deltaX = -clamp({ min: 0, max: detectionThreshold, value: -(deltaRight - detectionThreshold) });
  }

  if (deltaTop < detectionThreshold) {
    deltaY = clamp({ min: 0, max: detectionThreshold, value: -(deltaTop - detectionThreshold) });
  } else if (deltaBottom < detectionThreshold) {
    deltaY = -clamp({ min: 0, max: detectionThreshold, value: -(deltaBottom - detectionThreshold) });
  }

  if (deltaX === 0 && deltaY === 0) {
    return null;
  }

  let normalizedX = deltaX / detectionThreshold;
  let normalizedY = deltaY / detectionThreshold;

  normalizedX = isFinite(normalizedX) ? normalizedX : 1;
  normalizedY = isFinite(normalizedY) ? normalizedY : 1;

  const forceX = normalizedX * forceMultiplier;
  const forceY = normalizedY * forceMultiplier;

  return { x: forceX, y: forceY };
};
