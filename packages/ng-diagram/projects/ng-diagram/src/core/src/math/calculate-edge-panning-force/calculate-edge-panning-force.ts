import { Point, Rect } from '../../types';

export const calculateEdgePanningForce = (
  containerBox: Rect,
  clientPosition: Point,
  detectionThreshold: number,
  forceMultiplier: number
): Point | null => {
  const { x: containerX, y: containerY, width: containerWidth, height: containerHeight } = containerBox;
  const { x: clientX, y: clientY } = clientPosition;
  let forceX = 0;
  let forceY = 0;

  const deltaLeft = clientX - containerX;
  const deltaRight = containerX + containerWidth - clientX;
  const deltaTop = clientY - containerY;
  const deltaBottom = containerY + containerHeight - clientY;

  if (deltaLeft < detectionThreshold) {
    forceX = -(deltaLeft - detectionThreshold);
  } else if (deltaRight < detectionThreshold) {
    forceX = deltaRight - detectionThreshold;
  }

  if (deltaTop < detectionThreshold) {
    forceY = -(deltaTop - detectionThreshold);
  } else if (deltaBottom < detectionThreshold) {
    forceY = deltaBottom - detectionThreshold;
  }

  if (forceX === 0 && forceY === 0) {
    return null;
  }

  forceX =
    forceX === 0
      ? forceX
      : Math.sign(forceX) * Math.abs(forceX) * (1 / Math.log(Math.abs(forceX) + 1)) * forceMultiplier;
  forceY =
    forceY === 0
      ? forceY
      : Math.sign(forceY) * Math.abs(forceY) * (1 / Math.log(Math.abs(forceY) + 1)) * forceMultiplier;

  return { x: forceX, y: forceY };
};
