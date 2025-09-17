import { Point, PortLocation, PortSide } from '../../../../../types';
import { getPathPointsFromBottom } from './get-pathpoints-from-bottom';
import { getPathPointsFromLeft } from './get-pathpoints-from-left';
import { getPathPointsFromRight } from './get-pathpoints-from-right';
import { getPathPointsFromTop } from './get-pathpoints-from-top';

const positionFunctionMap: Record<
  PortSide,
  (
    targetPosition: PortSide,
    xySource: Point,
    xyTarget: Point,
    xyCenter: Point,
    firstLastSegmentLength: number
  ) =>
    | {
        x: number;
        y: number;
      }[]
    | undefined
> = {
  top: getPathPointsFromTop,
  right: getPathPointsFromRight,
  bottom: getPathPointsFromBottom,
  left: getPathPointsFromLeft,
};

/**
 * Function that returns the default points between the source and target
 * for an orthogonal path.
 *
 * @returns An array of points representing the orthogonal path.
 * @param source
 * @param target
 * @param xyCenter The center point of the path
 * @param firstLastSegmentLength The length of the first and last segments
 * @returns An array of points representing the orthogonal path.
 */
export const getPathPoints = (
  source: PortLocation,
  target: PortLocation,
  xyCenter: Point,
  firstLastSegmentLength = 20
) => {
  const getPositionFunction = positionFunctionMap[source.side] || getPathPointsFromLeft;
  return getPositionFunction(
    target.side,
    { x: source.x, y: source.y },
    { x: target.x, y: target.y },
    xyCenter,
    firstLastSegmentLength
  );
};
