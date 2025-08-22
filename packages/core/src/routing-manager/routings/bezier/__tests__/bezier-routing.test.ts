import { beforeEach, describe, expect, it } from 'vitest';
import { PortLocation, RoutingConfiguration } from '../../../../types';
import { BezierRouting } from '../bezier-routing';

describe('BezierRouting', () => {
  let bezierRouting: BezierRouting;

  beforeEach(() => {
    bezierRouting = new BezierRouting();
  });

  describe('name property', () => {
    it('should have name "bezier"', () => {
      expect(bezierRouting.name).toBe('bezier');
    });
  });

  describe('calculatePoints', () => {
    it('should calculate points with default offset', () => {
      const source: PortLocation = { x: 100, y: 200, side: 'right' };
      const target: PortLocation = { x: 400, y: 200, side: 'left' };

      const points = bezierRouting.calculatePoints(source, target);

      expect(points).toHaveLength(4);
      expect(points[0]).toEqual({ x: 100, y: 200 }); // source
      expect(points[1]).toEqual({ x: 200, y: 200 }); // source control (right +100)
      expect(points[2]).toEqual({ x: 300, y: 200 }); // target control (left -100)
      expect(points[3]).toEqual({ x: 400, y: 200 }); // target
    });

    it('should calculate points with custom offset from config', () => {
      const source: PortLocation = { x: 100, y: 200, side: 'right' };
      const target: PortLocation = { x: 400, y: 200, side: 'left' };
      const config: RoutingConfiguration = {
        bezier: { bezierControlOffset: 50 },
      };

      const points = bezierRouting.calculatePoints(source, target, config);

      expect(points).toHaveLength(4);
      expect(points[0]).toEqual({ x: 100, y: 200 }); // source
      expect(points[1]).toEqual({ x: 150, y: 200 }); // source control (right +50)
      expect(points[2]).toEqual({ x: 350, y: 200 }); // target control (left -50)
      expect(points[3]).toEqual({ x: 400, y: 200 }); // target
    });

    it('should handle vertical connections', () => {
      const source: PortLocation = { x: 200, y: 100, side: 'bottom' };
      const target: PortLocation = { x: 200, y: 400, side: 'top' };

      const points = bezierRouting.calculatePoints(source, target);

      expect(points).toHaveLength(4);
      expect(points[0]).toEqual({ x: 200, y: 100 }); // source
      expect(points[1]).toEqual({ x: 200, y: 200 }); // source control (bottom +100)
      expect(points[2]).toEqual({ x: 200, y: 300 }); // target control (top -100)
      expect(points[3]).toEqual({ x: 200, y: 400 }); // target
    });

    it('should handle diagonal connections', () => {
      const source: PortLocation = { x: 100, y: 100, side: 'right' };
      const target: PortLocation = { x: 300, y: 300, side: 'bottom' };

      const points = bezierRouting.calculatePoints(source, target);

      expect(points).toHaveLength(4);
      expect(points[0]).toEqual({ x: 100, y: 100 }); // source
      expect(points[1]).toEqual({ x: 200, y: 100 }); // source control (right +100)
      expect(points[2]).toEqual({ x: 300, y: 400 }); // target control (bottom +100)
      expect(points[3]).toEqual({ x: 300, y: 300 }); // target
    });

    it('should handle zero offset', () => {
      const source: PortLocation = { x: 100, y: 200, side: 'right' };
      const target: PortLocation = { x: 400, y: 200, side: 'left' };
      const config: RoutingConfiguration = {
        bezier: { bezierControlOffset: 0 },
      };

      const points = bezierRouting.calculatePoints(source, target, config);

      expect(points).toHaveLength(4);
      expect(points[0]).toEqual({ x: 100, y: 200 });
      expect(points[1]).toEqual({ x: 100, y: 200 }); // same as source
      expect(points[2]).toEqual({ x: 400, y: 200 }); // same as target
      expect(points[3]).toEqual({ x: 400, y: 200 });
    });

    it('should handle undefined config', () => {
      const source: PortLocation = { x: 0, y: 0, side: 'right' };
      const target: PortLocation = { x: 200, y: 0, side: 'left' };

      const points = bezierRouting.calculatePoints(source, target, undefined);

      expect(points).toHaveLength(4);
      // Should use default offset of 100
      expect(points[1]).toEqual({ x: 100, y: 0 });
      expect(points[2]).toEqual({ x: 100, y: 0 });
    });

    it('should handle config without bezier property', () => {
      const source: PortLocation = { x: 0, y: 0, side: 'right' };
      const target: PortLocation = { x: 200, y: 0, side: 'left' };
      const config: RoutingConfiguration = {};

      const points = bezierRouting.calculatePoints(source, target, config);

      expect(points).toHaveLength(4);
      // Should use default offset of 100
      expect(points[1]).toEqual({ x: 100, y: 0 });
      expect(points[2]).toEqual({ x: 100, y: 0 });
    });
  });

  describe('generateSvgPath', () => {
    it('should generate cubic bezier path for 4 points', () => {
      const points = [
        { x: 0, y: 100 },
        { x: 25, y: 0 },
        { x: 75, y: 0 },
        { x: 100, y: 100 },
      ];

      const path = bezierRouting.generateSvgPath(points);

      expect(path).toBe('M 0,100 C 25,0 75,0 100,100');
    });

    it('should generate line path for 2 points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];

      const path = bezierRouting.generateSvgPath(points);

      expect(path).toBe('M 0,0 L 100,100');
    });

    it('should generate move command for single point', () => {
      const points = [{ x: 50, y: 50 }];

      const path = bezierRouting.generateSvgPath(points);

      expect(path).toBe('M 50,50');
    });

    it('should return empty string for empty array', () => {
      const path = bezierRouting.generateSvgPath([]);

      expect(path).toBe('');
    });

    it('should handle polyline for more than 4 points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 25, y: 50 },
        { x: 50, y: 25 },
        { x: 75, y: 75 },
        { x: 100, y: 100 },
      ];

      const path = bezierRouting.generateSvgPath(points);

      expect(path).toBe('M 0,0 L 25,50 L 50,25 L 75,75 L 100,100');
    });
  });

  describe('getPointOnPath', () => {
    it('should return start point at 0%', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 75, y: 100 },
        { x: 100, y: 100 },
      ];

      const point = bezierRouting.getPointOnPath(points, 0);

      expect(point).toEqual({ x: 0, y: 0 });
    });

    it('should return end point at 100%', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 75, y: 100 },
        { x: 100, y: 100 },
      ];

      const point = bezierRouting.getPointOnPath(points, 1);

      expect(point).toEqual({ x: 100, y: 100 });
    });

    it('should return midpoint at 50%', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 0, y: 50 },
        { x: 100, y: 50 },
        { x: 100, y: 100 },
      ];

      const point = bezierRouting.getPointOnPath(points, 0.5);

      expect(point).toEqual({ x: 50, y: 50 });
    });

    it('should handle clamping for values outside 0-1', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 75, y: 100 },
        { x: 100, y: 100 },
      ];

      const pointNegative = bezierRouting.getPointOnPath(points, -0.5);
      const pointOverOne = bezierRouting.getPointOnPath(points, 1.5);

      expect(pointNegative).toEqual({ x: 0, y: 0 }); // clamped to 0
      expect(pointOverOne).toEqual({ x: 100, y: 100 }); // clamped to 1
    });

    it('should fall back to linear interpolation for 2 points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];

      const point = bezierRouting.getPointOnPath(points, 0.5);

      expect(point).toEqual({ x: 50, y: 50 });
    });

    it('should return (0,0) for single point', () => {
      const points = [{ x: 50, y: 50 }];

      const point = bezierRouting.getPointOnPath(points, 0.5);

      expect(point).toEqual({ x: 0, y: 0 });
    });

    it('should return (0,0) for empty array', () => {
      const point = bezierRouting.getPointOnPath([], 0.5);

      expect(point).toEqual({ x: 0, y: 0 });
    });
  });

  describe('integration tests', () => {
    it('should work end-to-end from source/target to SVG path', () => {
      const source: PortLocation = { x: 100, y: 200, side: 'right' };
      const target: PortLocation = { x: 400, y: 200, side: 'left' };

      // Calculate points
      const points = bezierRouting.calculatePoints(source, target);

      // Generate SVG path
      const path = bezierRouting.generateSvgPath(points);

      expect(path).toBe('M 100,200 C 200,200 300,200 400,200');
    });

    it('should work with custom configuration', () => {
      const source: PortLocation = { x: 0, y: 0, side: 'bottom' };
      const target: PortLocation = { x: 100, y: 100, side: 'top' };
      const config: RoutingConfiguration = {
        bezier: { bezierControlOffset: 25 },
      };

      // Calculate points with custom offset
      const points = bezierRouting.calculatePoints(source, target, config);

      expect(points).toHaveLength(4);
      expect(points[1]).toEqual({ x: 0, y: 25 }); // source control (bottom +25)
      expect(points[2]).toEqual({ x: 100, y: 75 }); // target control (top -25)

      // Generate SVG path
      const path = bezierRouting.generateSvgPath(points);

      expect(path).toBe('M 0,0 C 0,25 100,75 100,100');

      // Get point on path
      const midPoint = bezierRouting.getPointOnPath(points, 0.5);

      expect(midPoint.x).toBeCloseTo(50, 1);
      expect(midPoint.y).toBeCloseTo(50, 1); // Midpoint for this specific curve
    });

    it('should handle complex routing scenario', () => {
      const source: PortLocation = { x: -50, y: -50, side: 'left' };
      const target: PortLocation = { x: 150, y: 150, side: 'right' };

      const points = bezierRouting.calculatePoints(source, target);

      expect(points[0]).toEqual({ x: -50, y: -50 });
      expect(points[1]).toEqual({ x: -150, y: -50 }); // left -100
      expect(points[2]).toEqual({ x: 250, y: 150 }); // right +100
      expect(points[3]).toEqual({ x: 150, y: 150 });

      const path = bezierRouting.generateSvgPath(points);
      expect(path).toBe('M -50,-50 C -150,-50 250,150 150,150');

      // Check various points along the path
      const quarterPoint = bezierRouting.getPointOnPath(points, 0.25);
      const halfPoint = bezierRouting.getPointOnPath(points, 0.5);
      const threeQuarterPoint = bezierRouting.getPointOnPath(points, 0.75);

      // These should be different points along the curve
      expect(quarterPoint).not.toEqual(halfPoint);
      expect(halfPoint).not.toEqual(threeQuarterPoint);

      // Should progress from source to target
      expect(quarterPoint.x).toBeGreaterThan(-50);
      expect(quarterPoint.x).toBeLessThan(halfPoint.x);
      expect(halfPoint.x).toBeLessThan(threeQuarterPoint.x);
      expect(threeQuarterPoint.x).toBeLessThan(150);
    });
  });
});
