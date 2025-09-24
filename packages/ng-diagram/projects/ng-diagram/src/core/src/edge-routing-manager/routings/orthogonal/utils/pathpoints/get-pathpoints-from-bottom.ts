import { Point, PortSide } from '../../../../../types';
import { getOffsetPoint } from '../get-offset-point';

export const getPathPointsFromBottom = (
  targetPortSide: PortSide,
  xySource: Point,
  xyTarget: Point,
  xyCenter: Point,
  firstLastSegmentLength = 20
) => {
  const sourcePort = getOffsetPoint({ x: xySource.x, y: xySource.y }, 'bottom', firstLastSegmentLength);
  const targetPort = getOffsetPoint({ x: xyTarget.x, y: xyTarget.y }, targetPortSide, firstLastSegmentLength);

  if (targetPortSide === 'bottom') {
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
  if (targetPortSide === 'left') {
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
  if (targetPortSide === 'top') {
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
  if (targetPortSide === 'right') {
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
