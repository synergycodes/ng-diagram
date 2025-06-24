import { Point } from '../../types';
import { Position } from './initial-positions/get-initial-path-points.ts';
import { POINT_DISTANCE } from './constants.ts';

/**
 * Calculates the offset point based on the given position.
 *
 * @param point - The original point with x and y coordinates.
 * @param position - The position assigned to Handle (Left, Right, Top, Bottom).
 * @returns An object containing the new x and y coordinates after applying the offset.
 */
export const getOffsetPoint = (point: Point, position: Position) => {
	const offset = {
		[Position.Left]: { x: -POINT_DISTANCE, y: 0 },
		[Position.Right]: { x: POINT_DISTANCE, y: 0 },
		[Position.Top]: { x: 0, y: -POINT_DISTANCE },
		[Position.Bottom]: { x: 0, y: POINT_DISTANCE },
	}[position] || { x: 0, y: 0 };

	return {
		x: point.x + offset.x,
		y: point.y + offset.y,
	};
};

/**
 * Snaps a given point to the nearest grid intersection.
 *
 * @param point - The point to be snapped, represented as an object with `x` and `y` properties.
 * @param gridSize - The size of the grid, represented as a tuple with two numbers `[gridWidth, gridHeight]`.
 * @returns An object representing the snapped point with `x` and `y` properties.
 */
export const snapToGrid = (
	point: Point,
	[gridWidth, gridHeight]: [number, number],
) => ({
	x: Math.round(point.x / gridWidth) * gridWidth,
	y: Math.round(point.y / gridHeight) * gridHeight,
});
