import { getInitialPositionSourceBottom } from './get-initial-position-source-bottom.ts';
import { getInitialPositionSourceLeft } from './get-initial-position-source-left.ts';
import { getInitialPositionSourceRight } from './get-initial-position-source-right.ts';
import { getInitialPositionSourceTop } from './get-initial-position-source-top.ts';
import { Point } from '../../../types';

export enum Position {
  Left = "left",
  Top = "top",
  Right = "right",
  Bottom = "bottom"
}
const positionFunctionMap = {
	[Position.Top]: getInitialPositionSourceTop,
	[Position.Right]: getInitialPositionSourceRight,
	[Position.Bottom]: getInitialPositionSourceBottom,
	[Position.Left]: getInitialPositionSourceLeft,
};

/**
 * Function that returns the default points between the source and target
 * for an orthogonal path.
 *
 * @returns An array of points representing the orthogonal path.
 * @param sourcePosition source Handle position
 * @param targetPosition target Handle position
 * @param xySource The starting XYPosition of the edge
 * @param xyTarget The ending XYPosition of the edge
 * @param xyCenter The center point of the path
 * @returns An array of points representing the orthogonal path.
 */
export const getInitialPathPoints = (
	sourcePosition: Position,
	targetPosition: Position,
	xySource: Point,
	xyTarget: Point,
	xyCenter: Point,
) => {
	const getPositionFunction =
		positionFunctionMap[sourcePosition] || getInitialPositionSourceLeft;
	return getPositionFunction(targetPosition, xySource, xyTarget, xyCenter);
};
