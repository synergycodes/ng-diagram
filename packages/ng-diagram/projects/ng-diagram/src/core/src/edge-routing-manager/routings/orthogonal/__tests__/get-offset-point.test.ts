import { describe, expect, it } from 'vitest';
import type { PortSide } from '../../../../types';
import { getOffsetPoint } from '../utils/get-offset-point';

describe('getOffsetPoint', () => {
  const point = { x: 10, y: 20 };
  const defaultDistance = 20;

  it('should offset left with default distance', () => {
    expect(getOffsetPoint(point, 'left')).toEqual({ x: 10 - defaultDistance, y: 20 });
  });

  it('should offset right with default distance', () => {
    expect(getOffsetPoint(point, 'right')).toEqual({ x: 10 + defaultDistance, y: 20 });
  });

  it('should offset top with default distance', () => {
    expect(getOffsetPoint(point, 'top')).toEqual({ x: 10, y: 20 - defaultDistance });
  });

  it('should offset bottom with default distance', () => {
    expect(getOffsetPoint(point, 'bottom')).toEqual({ x: 10, y: 20 + defaultDistance });
  });

  it('should offset with custom distance', () => {
    const customDistance = 30;
    expect(getOffsetPoint(point, 'left', customDistance)).toEqual({ x: 10 - customDistance, y: 20 });
    expect(getOffsetPoint(point, 'right', customDistance)).toEqual({ x: 10 + customDistance, y: 20 });
    expect(getOffsetPoint(point, 'top', customDistance)).toEqual({ x: 10, y: 20 - customDistance });
    expect(getOffsetPoint(point, 'bottom', customDistance)).toEqual({ x: 10, y: 20 + customDistance });
  });

  it('should return original point for unknown side', () => {
    expect(getOffsetPoint(point, 'unknown' as PortSide)).toEqual({ x: 10, y: 20 });
    expect(getOffsetPoint(point, 'unknown' as PortSide, 50)).toEqual({ x: 10, y: 20 });
  });
});
