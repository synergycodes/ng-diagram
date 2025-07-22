import { describe, expect, it } from 'vitest';
import type { PortSide } from '../../types';
import { getBezierPathPoints } from '../get-bezier-path-points';

describe('getBezierPathPoints', () => {
  it('should return empty array if source or target is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getBezierPathPoints(null as any, { x: 1, y: 2, side: 'left' as PortSide })).toEqual([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getBezierPathPoints({ x: 1, y: 2, side: 'left' as PortSide }, null as any)).toEqual([]);
  });

  it('should return correct bezier points with default offset', () => {
    const source = { x: 10, y: 20, side: 'left' as PortSide };
    const target = { x: 110, y: 120, side: 'right' as PortSide };
    expect(getBezierPathPoints(source, target)).toEqual([
      { x: 10, y: 20 },
      { x: 110, y: 20 },
      { x: 10, y: 120 },
      { x: 110, y: 120 },
    ]);
  });

  it('should return correct bezier points with custom offset', () => {
    const source = { x: 0, y: 0, side: 'top' as PortSide };
    const target = { x: 200, y: 0, side: 'bottom' as PortSide };
    expect(getBezierPathPoints(source, target, 50)).toEqual([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 150, y: 0 },
      { x: 200, y: 0 },
    ]);
  });
});
