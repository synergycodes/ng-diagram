import { describe, expect, it } from 'vitest';
import type { PortSide } from '../../../types';
import { POINT_DISTANCE } from '../constants.ts';
import { getOffsetPoint } from '../get-offset-point';

describe('getOffsetPoint', () => {
  const point = { x: 10, y: 20 };

  it('should offset left', () => {
    expect(getOffsetPoint(point, 'left')).toEqual({ x: 10 - POINT_DISTANCE, y: 20 });
  });

  it('should offset right', () => {
    expect(getOffsetPoint(point, 'right')).toEqual({ x: 10 + POINT_DISTANCE, y: 20 });
  });

  it('should offset top', () => {
    expect(getOffsetPoint(point, 'top')).toEqual({ x: 10, y: 20 - POINT_DISTANCE });
  });

  it('should offset bottom', () => {
    expect(getOffsetPoint(point, 'bottom')).toEqual({ x: 10, y: 20 + POINT_DISTANCE });
  });

  it('should return original point for unknown side', () => {
    expect(getOffsetPoint(point, 'unknown' as PortSide)).toEqual({ x: 10, y: 20 });
  });
});
