import { Position } from './get-initial-path-points.ts';
import { Point } from '../../../types';
import { getOffsetPoint } from '../get-offset-point.ts';

export const getInitialPositionSourceBottom = (
	targetPosition: Position,
	xySource: Point,
	xyTarget: Point,
	xyCenter: Point,
) => {
	const sourcePort = getOffsetPoint(
		{ x: xySource.x, y: xySource.y },
		Position.Bottom,
	);
	const targetPort = getOffsetPoint(
		{ x: xyTarget.x, y: xyTarget.y },
		targetPosition,
	);

	if (targetPosition === Position.Bottom) {
		if (sourcePort.y > targetPort.y) {
			return [
				{ x: sourcePort.x, y: sourcePort.y },
				{ x: targetPort.x, y: sourcePort.y },
			];
		}
		return [
			{ x: sourcePort.x, y: targetPort.y },
			{ x: targetPort.x, y: targetPort.y },
		];
	}
	if (targetPosition === Position.Left) {
		if (sourcePort.y > targetPort.y) {
			if (sourcePort.x > targetPort.x) {
				return [
					{ x: sourcePort.x, y: sourcePort.y },
					{ x: targetPort.x, y: sourcePort.y },
					{
						x: targetPort.x,
						y: targetPort.y,
					},
				];
			}
			return [
				{ x: sourcePort.x, y: sourcePort.y },
				{ x: xyCenter.x, y: sourcePort.y },
				{
					x: xyCenter.x,
					y: targetPort.y,
				},
			];
		}
		if (sourcePort.x > targetPort.x) {
			return [
				{ x: sourcePort.x, y: xyCenter.y },
				{ x: targetPort.x, y: xyCenter.y },
				{
					x: targetPort.x,
					y: targetPort.y,
				},
			];
		}
		return [{ x: sourcePort.x, y: targetPort.y }];
	}
	if (targetPosition === Position.Top) {
		if (sourcePort.y > targetPort.y) {
			return [
				{ x: sourcePort.x, y: sourcePort.y },
				{ x: xyCenter.x, y: sourcePort.y },
				{
					x: xyCenter.x,
					y: targetPort.y,
				},
				{ x: targetPort.x, y: targetPort.y },
			];
		}
		return [
			{ x: sourcePort.x, y: xyCenter.y },
			{ x: targetPort.x, y: xyCenter.y },
		];
	}
	if (targetPosition === Position.Right) {
		if (sourcePort.y > targetPort.y) {
			if (sourcePort.x > targetPort.x) {
				return [
					{ x: sourcePort.x, y: sourcePort.y },
					{ x: xyCenter.x, y: sourcePort.y },
					{
						x: xyCenter.x,
						y: targetPort.y,
					},
					{ x: targetPort.x, y: targetPort.y },
				];
			}
			return [
				{ x: sourcePort.x, y: sourcePort.y },
				{ x: targetPort.x, y: sourcePort.y },
				{
					x: targetPort.x,
					y: targetPort.y,
				},
			];
		}
		if (sourcePort.x > targetPort.x) {
			return [{ x: sourcePort.x, y: targetPort.y }];
		}
		return [
			{ x: sourcePort.x, y: xyCenter.y },
			{ x: targetPort.x, y: xyCenter.y },
			{
				x: targetPort.x,
				y: targetPort.y,
			},
		];
	}
};
