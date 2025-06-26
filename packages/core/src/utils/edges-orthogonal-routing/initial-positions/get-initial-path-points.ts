import { getInitialPositionSourceBottom } from './get-initial-position-source-bottom.ts';
import { getInitialPositionSourceLeft } from './get-initial-position-source-left.ts';
import { getInitialPositionSourceRight } from './get-initial-position-source-right.ts';
import { getInitialPositionSourceTop } from './get-initial-position-source-top.ts';
import { Point, PortLocation, PortSide } from '../../../types';

export enum Position {
  Left = 'left',
  Top = 'top',
  Right = 'right',
  Bottom = 'bottom',
}

const positionFunctionMap: Record<
  PortSide,
  (
    targetPosition: PortSide,
    xySource: Point,
    xyTarget: Point,
    xyCenter: Point
  ) =>
    | {
        x: number;
        y: number;
      }[]
    | undefined
> = {
  top: getInitialPositionSourceTop,
  right: getInitialPositionSourceRight,
  bottom: getInitialPositionSourceBottom,
  left: getInitialPositionSourceLeft,
};

/**
 * Function that returns the default points between the source and target
 * for an orthogonal path.
 *
 * @returns An array of points representing the orthogonal path.
 * @param source
 * @param target
 * @param xyCenter The center point of the path
 * @returns An array of points representing the orthogonal path.
 */
export const getInitialPathPoints = (source: PortLocation, target: PortLocation, xyCenter: Point) => {
  const getPositionFunction = positionFunctionMap[source.side] || getInitialPositionSourceLeft;
  return getPositionFunction(target.side, { x: source.x, y: source.y }, { x: target.x, y: target.y }, xyCenter);
};
