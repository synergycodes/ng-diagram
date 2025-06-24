import { getOffsetPoint } from '../get-offset-point.ts';
import { Position } from './get-initial-path-points.ts';
import { Point, PortSide } from '../../../types';

export const getInitialPositionSourceLeft = (
	targetPortSide: PortSide,
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
		targetPortSide,
	);

	if (targetPortSide === Position.Left) {
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
	if (targetPortSide === Position.Top) {
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
	if (targetPortSide === Position.Bottom) {
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
	if (targetPortSide === Position.Right) {
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
