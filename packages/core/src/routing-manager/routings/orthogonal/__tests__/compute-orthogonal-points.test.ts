import { describe, expect, it } from 'vitest';
import { PortSide } from '../../../../types';
import { computeOrthogonalPoints } from '../compute-orthogonal-points';

describe('computeOrthogonalPoints', () => {
  it('should return correct path points for horizontal line', () => {
    const source = { x: 0, y: 0, side: 'left' as PortSide };
    const target = { x: 100, y: 0, side: 'right' as PortSide };
    const points = computeOrthogonalPoints(source, target);
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points[points.length - 1]).toEqual({ x: 100, y: 0 });
    expect(points.length).toBeGreaterThanOrEqual(2);
  });

  it('should return correct path points for vertical line', () => {
    const source = { x: 0, y: 0, side: 'top' as PortSide };
    const target = { x: 0, y: 100, side: 'bottom' as PortSide };
    const points = computeOrthogonalPoints(source, target);
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points[points.length - 1]).toEqual({ x: 0, y: 100 });
    expect(points.length).toBeGreaterThanOrEqual(2);
  });

  it('should return correct path points for diagonal', () => {
    const source = { x: 10, y: 20, side: 'left' as PortSide };
    const target = { x: 110, y: 120, side: 'right' as PortSide };
    const points = computeOrthogonalPoints(source, target);
    expect(points[0]).toEqual({ x: 10, y: 20 });
    expect(points[points.length - 1]).toEqual({ x: 110, y: 120 });
    expect(points.length).toBeGreaterThanOrEqual(2);
  });

  it('should return two points if source and target are the same', () => {
    const source = { x: 50, y: 50, side: 'top' as PortSide };
    const target = { x: 50, y: 50, side: 'bottom' as PortSide };
    const points = computeOrthogonalPoints(source, target);
    expect(points[0]).toEqual({ x: 50, y: 50 });
    expect(points[points.length - 1]).toEqual({ x: 50, y: 50 });
    expect(points.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle negative coordinates', () => {
    const source = { x: -10, y: -20, side: 'left' as PortSide };
    const target = { x: 10, y: 20, side: 'right' as PortSide };
    const points = computeOrthogonalPoints(source, target);
    expect(points[0]).toEqual({ x: -10, y: -20 });
    expect(points[points.length - 1]).toEqual({ x: 10, y: 20 });
    expect(points.length).toBeGreaterThanOrEqual(2);
  });
});
