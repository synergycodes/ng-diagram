import { getOffsetPoint } from '../get-offset-point.ts';
import { Position } from './get-initial-path-points.ts';
import { Point } from '../../../types';

export const getInitialPositionSourceTop = (
  targetPosition: Position,
  xySource: Point,
  xyTarget: Point,
  xyCenter: Point
) => {
  const sourcePort = getOffsetPoint(xySource, Position.Top);
  const targetPort = getOffsetPoint(xyTarget, targetPosition);

  if (targetPosition === Position.Left) {
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
  if (targetPosition === Position.Right) {
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
  if (targetPosition === Position.Bottom) {
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
  if (targetPosition === Position.Top) {
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
