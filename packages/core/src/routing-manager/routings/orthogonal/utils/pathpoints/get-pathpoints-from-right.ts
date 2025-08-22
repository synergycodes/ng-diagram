import { Point, PortSide } from '../../../../../types';
import { getOffsetPoint } from '../get-offset-point.ts';

export const getPathPointsFromRight = (
  targetPortSide: PortSide,
  xySource: Point,
  xyTarget: Point,
  xyCenter: Point,
  firstLastSegmentLength = 20
) => {
  const sourcePort = getOffsetPoint({ x: xySource.x, y: xySource.y }, 'right', firstLastSegmentLength);
  const targetPort = getOffsetPoint({ x: xyTarget.x, y: xyTarget.y }, targetPortSide, firstLastSegmentLength);

  if (targetPortSide === 'right') {
    if (sourcePort.x > targetPort.x) {
      return [
        { x: sourcePort.x, y: sourcePort.y },
        { x: sourcePort.x, y: targetPort.y },
      ];
    }
    return [
      { x: targetPort.x, y: sourcePort.y },
      { x: targetPort.x, y: targetPort.y },
    ];
  }
  if (targetPortSide === 'top') {
    if (sourcePort.x < targetPort.x) {
      if (sourcePort.y < targetPort.y) {
        return [{ x: targetPort.x, y: sourcePort.y }];
      }
      return [
        { x: xyCenter.x, y: sourcePort.y },
        { x: xyCenter.x, y: targetPort.y },
        { x: targetPort.x, y: targetPort.y },
      ];
    }
    if (sourcePort.y < targetPort.y) {
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
  if (targetPortSide === 'bottom') {
    if (sourcePort.x < targetPort.x) {
      if (sourcePort.y < targetPort.y) {
        return [
          { x: xyCenter.x, y: sourcePort.y },
          { x: xyCenter.x, y: targetPort.y },
          { x: targetPort.x, y: targetPort.y },
        ];
      }
      return [{ x: targetPort.x, y: sourcePort.y }];
    }
    if (sourcePort.y < targetPort.y) {
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
  if (targetPortSide === 'left') {
    if (sourcePort.x < targetPort.x) {
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
