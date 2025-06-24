import { getOffsetPoint } from '../get-offset-point.ts';
import { Point, PortSide } from '../../../types';

export const getInitialPositionSourceTop = (
  targetPortSide: PortSide,
  xySource: Point,
  xyTarget: Point,
  xyCenter: Point
) => {
  const sourcePort = getOffsetPoint(xySource, 'top');
  const targetPort = getOffsetPoint(xyTarget, targetPortSide);

  if (targetPortSide === 'left') {
    if (sourcePort.y > targetPort.y) {
      if (sourcePort.x > targetPort.x) {
        return [
          {
            x: sourcePort.x,
            y: xyCenter.y,
          },
          {
            x: targetPort.x,
            y: xyCenter.y,
          },
          {
            x: targetPort.x,
            y: targetPort.y,
          },
        ];
      }
      return [
        {
          x: sourcePort.x,
          y: targetPort.y,
        },
      ];
    }
    if (sourcePort.x > targetPort.x) {
      return [
        {
          x: sourcePort.x,
          y: sourcePort.y,
        },
        {
          x: targetPort.x,
          y: sourcePort.y,
        },
        {
          x: targetPort.x,
          y: targetPort.y,
        },
      ];
    }
    return [
      {
        x: sourcePort.x,
        y: sourcePort.y,
      },
      {
        x: xyCenter.x,
        y: sourcePort.y,
      },
      {
        x: xyCenter.x,
        y: targetPort.y,
      },
    ];
  }
  if (targetPortSide === 'right') {
    if (sourcePort.y > targetPort.y) {
      if (sourcePort.x > targetPort.x) {
        return [
          {
            x: sourcePort.x,
            y: targetPort.y,
          },
        ];
      }
      return [
        {
          x: sourcePort.x,
          y: xyCenter.y,
        },
        {
          x: targetPort.x,
          y: xyCenter.y,
        },
        {
          x: targetPort.x,
          y: targetPort.y,
        },
      ];
    }
    if (sourcePort.x > targetPort.x) {
      return [
        {
          x: sourcePort.x,
          y: sourcePort.y,
        },
        {
          x: xyCenter.x,
          y: sourcePort.y,
        },
        {
          x: xyCenter.x,
          y: targetPort.y,
        },
      ];
    }
    return [
      { x: sourcePort.x, y: sourcePort.y },
      {
        x: targetPort.x,
        y: sourcePort.y,
      },
      { x: targetPort.x, y: targetPort.y },
    ];
  }
  if (targetPortSide === 'bottom') {
    if (sourcePort.y > targetPort.y) {
      return [
        {
          x: sourcePort.x,
          y: xyCenter.y,
        },
        {
          x: targetPort.x,
          y: xyCenter.y,
        },
        {
          x: targetPort.x,
          y: targetPort.y,
        },
      ];
    }
    return [
      {
        x: sourcePort.x,
        y: sourcePort.y,
      },
      {
        x: xyCenter.x,
        y: sourcePort.y,
      },
      {
        x: xyCenter.x,
        y: targetPort.y,
      },
      {
        x: targetPort.x,
        y: targetPort.y,
      },
    ];
  }
  if (targetPortSide === 'top') {
    if (sourcePort.y > targetPort.y) {
      return [
        {
          x: sourcePort.x,
          y: targetPort.y,
        },
        { x: targetPort.x, y: targetPort.y },
      ];
    }
    return [
      {
        x: sourcePort.x,
        y: sourcePort.y,
      },
      { x: targetPort.x, y: sourcePort.y },
    ];
  }
};
