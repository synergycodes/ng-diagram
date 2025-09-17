import { describe, expect, it } from 'vitest';
import { PortSide } from '../../../../types';
import { computeOrthogonalPoints } from '../compute-orthogonal-points';

describe('computeOrthogonalPoints', () => {
  describe('basic path generation', () => {
    it('should always include source and target points', () => {
      const source = { x: 0, y: 0, side: 'right' as PortSide };
      const target = { x: 100, y: 100, side: 'left' as PortSide };
      const points = computeOrthogonalPoints(source, target);

      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[points.length - 1]).toEqual({ x: 100, y: 100 });
    });

    it('should generate orthogonal path (only horizontal and vertical segments)', () => {
      const source = { x: 0, y: 0, side: 'right' as PortSide };
      const target = { x: 100, y: 100, side: 'left' as PortSide };
      const points = computeOrthogonalPoints(source, target);

      // Check that segments are either horizontal or vertical
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const isHorizontal = prev.y === curr.y && prev.x !== curr.x;
        const isVertical = prev.x === curr.x && prev.y !== curr.y;
        expect(isHorizontal || isVertical).toBe(true);
      }
    });
  });

  describe('side-specific routing', () => {
    it('should route from right to left sides', () => {
      const source = { x: 0, y: 50, side: 'right' as PortSide };
      const target = { x: 100, y: 50, side: 'left' as PortSide };
      const points = computeOrthogonalPoints(source, target);

      expect(points.length).toBeGreaterThanOrEqual(2);
      expect(points[0]).toEqual({ x: 0, y: 50 });
      expect(points[points.length - 1]).toEqual({ x: 100, y: 50 });

      // Should have intermediate points extending from sides
      if (points.length > 2) {
        // First segment should extend right from source
        expect(points[1].x).toBeGreaterThan(0);
        expect(points[1].y).toBe(50);
      }
    });

    it('should route from top to bottom sides', () => {
      const source = { x: 50, y: 0, side: 'top' as PortSide };
      const target = { x: 50, y: 100, side: 'bottom' as PortSide };
      const points = computeOrthogonalPoints(source, target);

      expect(points[0]).toEqual({ x: 50, y: 0 });
      expect(points[points.length - 1]).toEqual({ x: 50, y: 100 });
    });

    it('should handle opposite sides (right to left)', () => {
      const source = { x: 0, y: 0, side: 'right' as PortSide };
      const target = { x: 200, y: 0, side: 'left' as PortSide };
      const points = computeOrthogonalPoints(source, target, 30);

      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[points.length - 1]).toEqual({ x: 200, y: 0 });

      // Should extend from sides first
      if (points.length > 2) {
        expect(points[1].x).toBeGreaterThanOrEqual(30); // First segment extends right
        expect(points[points.length - 2].x).toBeLessThanOrEqual(170); // Last segment extends left
      }
    });

    it('should handle same side routing (both right)', () => {
      const source = { x: 0, y: 0, side: 'right' as PortSide };
      const target = { x: 0, y: 100, side: 'right' as PortSide };
      const points = computeOrthogonalPoints(source, target);

      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[points.length - 1]).toEqual({ x: 0, y: 100 });
      expect(points.length).toBeGreaterThan(2); // Should have intermediate points
    });
  });

  describe('firstLastSegmentLength parameter', () => {
    it('should use default segment length of 20', () => {
      const source = { x: 0, y: 0, side: 'right' as PortSide };
      const target = { x: 100, y: 0, side: 'left' as PortSide };
      const points = computeOrthogonalPoints(source, target); // No segment length specified

      if (points.length > 2) {
        // First point after source should be at least 20 units away
        expect(Math.abs(points[1].x - points[0].x) + Math.abs(points[1].y - points[0].y)).toBeGreaterThanOrEqual(20);
      }
    });

    it('should respect custom segment length', () => {
      const source = { x: 0, y: 0, side: 'right' as PortSide };
      const target = { x: 200, y: 0, side: 'left' as PortSide };
      const customLength = 50;
      const points = computeOrthogonalPoints(source, target, customLength);

      if (points.length > 2) {
        // First segment should extend at least customLength
        expect(points[1].x).toBeGreaterThanOrEqual(customLength);
        // Last segment should start at most at target.x - customLength
        expect(points[points.length - 2].x).toBeLessThanOrEqual(200 - customLength);
      }
    });

    it('should handle zero segment length', () => {
      const source = { x: 0, y: 0, side: 'right' as PortSide };
      const target = { x: 100, y: 100, side: 'left' as PortSide };
      const points = computeOrthogonalPoints(source, target, 0);

      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[points.length - 1]).toEqual({ x: 100, y: 100 });
      expect(points.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('edge cases', () => {
    it('should handle same position with different sides', () => {
      const source = { x: 50, y: 50, side: 'top' as PortSide };
      const target = { x: 50, y: 50, side: 'bottom' as PortSide };
      const points = computeOrthogonalPoints(source, target);

      expect(points[0]).toEqual({ x: 50, y: 50 });
      expect(points[points.length - 1]).toEqual({ x: 50, y: 50 });
      // Should still generate intermediate points to avoid overlap
      expect(points.length).toBeGreaterThan(2);
    });

    it('should handle negative coordinates', () => {
      const source = { x: -100, y: -50, side: 'right' as PortSide };
      const target = { x: 100, y: 50, side: 'left' as PortSide };
      const points = computeOrthogonalPoints(source, target);

      expect(points[0]).toEqual({ x: -100, y: -50 });
      expect(points[points.length - 1]).toEqual({ x: 100, y: 50 });

      // All segments should still be orthogonal
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const isOrthogonal = prev.x === curr.x || prev.y === curr.y;
        expect(isOrthogonal).toBe(true);
      }
    });

    it('should handle decimal coordinates', () => {
      const source = { x: 10.5, y: 20.7, side: 'right' as PortSide };
      const target = { x: 110.3, y: 120.9, side: 'left' as PortSide };
      const points = computeOrthogonalPoints(source, target);

      expect(points[0]).toEqual({ x: 10.5, y: 20.7 });
      expect(points[points.length - 1]).toEqual({ x: 110.3, y: 120.9 });
    });

    it('should handle very large coordinates', () => {
      const source = { x: 10000, y: 20000, side: 'right' as PortSide };
      const target = { x: 30000, y: 40000, side: 'left' as PortSide };
      const points = computeOrthogonalPoints(source, target);

      expect(points[0]).toEqual({ x: 10000, y: 20000 });
      expect(points[points.length - 1]).toEqual({ x: 30000, y: 40000 });
      expect(points.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('path characteristics', () => {
    it('should minimize the number of turns', () => {
      // For aligned horizontal ports, should be a straight line
      const source = { x: 0, y: 50, side: 'right' as PortSide };
      const target = { x: 100, y: 50, side: 'left' as PortSide };
      const points = computeOrthogonalPoints(source, target, 20);

      // Count turns (direction changes)
      let turns = 0;
      for (let i = 2; i < points.length; i++) {
        const prevDir = {
          x: points[i - 1].x - points[i - 2].x,
          y: points[i - 1].y - points[i - 2].y,
        };
        const currDir = {
          x: points[i].x - points[i - 1].x,
          y: points[i].y - points[i - 1].y,
        };

        // Direction changed if the axis of movement changed
        const prevHorizontal = prevDir.x !== 0;
        const currHorizontal = currDir.x !== 0;
        if (prevHorizontal !== currHorizontal) {
          turns++;
        }
      }

      // Should have minimal turns for this simple case
      expect(turns).toBeLessThanOrEqual(2);
    });
  });
});
