import { getOffsetPoint } from '../get-offset-point.ts';
import { Position } from './get-initial-path-points.ts';
import { Point } from '../../../types';

export const getInitialPositionSourceLeft = (
	targetPosition: Position,
	xySource: Point,
	xyTarget: Point,
	xyCenter: Point,
) => {
	const sourcePort = getOffsetPoint(
		{ x: xySource.x, y: xySource.y },
		Position.Left,
	);
	const targetPort = getOffsetPoint(
		{ x: xyTarget.x, y: xyTarget.y },
		targetPosition,
	);

	if (targetPosition === Position.Left) {
		if (sourcePort.x > targetPort.x) {
			return [
				{ x: targetPort.x, y: sourcePort.y },
				{ x: targetPort.x, y: targetPort.y },
			];
		}
		return [
			{ x: sourcePort.x, y: sourcePort.y },
			{ x: sourcePort.x, y: targetPort.y },
		];
	}
	if (targetPosition === Position.Top) {
		if (sourcePort.x > targetPort.x) {
			if (sourcePort.y > targetPort.y) {
				return [
					{ x: xyCenter.x, y: sourcePort.y },
					{ x: xyCenter.x, y: targetPort.y },
					{ x: targetPort.x, y: targetPort.y },
				];
			}
			return [{ x: targetPort.x, y: sourcePort.y }];
		}
		if (sourcePort.y > targetPort.y) {
			return [
				{ x: sourcePort.x, y: sourcePort.y },
				{ x: sourcePort.x, y: targetPort.y },
				{
					x: targetPort.x,
					y: targetPort.y,
				},
			];
		}
		return [
			{ x: sourcePort.x, y: sourcePort.y },
			{ x: sourcePort.x, y: xyCenter.y },
			{ x: targetPort.x, y: xyCenter.y },
		];
	}
	if (targetPosition === Position.Bottom) {
		if (sourcePort.x > targetPort.x) {
			if (sourcePort.y > targetPort.y) {
				return [
					{ x: sourcePort.x, y: sourcePort.y },
					{ x: targetPort.x, y: sourcePort.y },
				];
			}
			return [
				{ x: xyCenter.x, y: sourcePort.y },
				{ x: xyCenter.x, y: targetPort.y },
				{ x: targetPort.x, y: targetPort.y },
			];
		}
		if (sourcePort.y > targetPort.y) {
			return [
				{ x: sourcePort.x, y: sourcePort.y },
				{ x: sourcePort.x, y: xyCenter.y },
				{ x: targetPort.x, y: xyCenter.y },
			];
		}
		return [
			{ x: sourcePort.x, y: sourcePort.y },
			{ x: sourcePort.x, y: targetPort.y },
			{
				x: targetPort.x,
				y: targetPort.y,
			},
		];
	}
	if (targetPosition === Position.Right) {
		if (sourcePort.x > targetPort.x) {
			return [
				{ x: xyCenter.x, y: sourcePort.y },
				{ x: xyCenter.x, y: targetPort.y },
			];
		}
		return [
			{ x: sourcePort.x, y: sourcePort.y },
			{ x: sourcePort.x, y: xyCenter.y },
			{ x: targetPort.x, y: xyCenter.y },
			{ x: targetPort.x, y: targetPort.y },
		];
	}
};
