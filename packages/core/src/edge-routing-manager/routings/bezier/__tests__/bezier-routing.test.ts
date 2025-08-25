import { beforeEach, describe, expect, it } from 'vitest';
import { Edge, EdgeRoutingConfig, Node, PortLocation } from '../../../../types';
import { EdgeRoutingContext } from '../../../types';
import { BezierRouting } from '../bezier-routing';

describe('BezierRouting', () => {
  let bezierRouting: BezierRouting;

  beforeEach(() => {
    bezierRouting = new BezierRouting();
  });

  describe('computePoints', () => {
    it('should calculate points with default offset', () => {
      const source: PortLocation = { x: 100, y: 200, side: 'right' };
      const target: PortLocation = { x: 400, y: 200, side: 'left' };

      const context: EdgeRoutingContext = {
        sourcePoint: source,
        targetPoint: target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 300, y: 0 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      const points = bezierRouting.computePoints(context);

      expect(points).toHaveLength(4);
      expect(points[0]).toEqual({ x: 100, y: 200 }); // source
      expect(points[1]).toEqual({ x: 200, y: 200 }); // source control (right +100)
      expect(points[2]).toEqual({ x: 300, y: 200 }); // target control (left -100)
      expect(points[3]).toEqual({ x: 400, y: 200 }); // target
    });

    it('should calculate points with custom offset from config', () => {
      const source: PortLocation = { x: 100, y: 200, side: 'right' };
      const target: PortLocation = { x: 400, y: 200, side: 'left' };
      const config: EdgeRoutingConfig = {
        defaultRouting: 'polyline',
        bezier: { bezierControlOffset: 50 },
      };

      const context: EdgeRoutingContext = {
        sourcePoint: source,
        targetPoint: target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 300, y: 0 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      const points = bezierRouting.computePoints(context, config);

      expect(points).toHaveLength(4);
      expect(points[0]).toEqual({ x: 100, y: 200 }); // source
      expect(points[1]).toEqual({ x: 150, y: 200 }); // source control (right +50)
      expect(points[2]).toEqual({ x: 350, y: 200 }); // target control (left -50)
      expect(points[3]).toEqual({ x: 400, y: 200 }); // target
    });

    it('should handle vertical connections', () => {
      const source: PortLocation = { x: 200, y: 100, side: 'bottom' };
      const target: PortLocation = { x: 200, y: 400, side: 'top' };

      const context: EdgeRoutingContext = {
        sourcePoint: source,
        targetPoint: target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 0, y: 300 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      const points = bezierRouting.computePoints(context);

      expect(points).toHaveLength(4);
      expect(points[0]).toEqual({ x: 200, y: 100 }); // source
      expect(points[1]).toEqual({ x: 200, y: 200 }); // source control (bottom +100)
      expect(points[2]).toEqual({ x: 200, y: 300 }); // target control (top -100)
      expect(points[3]).toEqual({ x: 200, y: 400 }); // target
    });

    it('should handle diagonal connections', () => {
      const source: PortLocation = { x: 100, y: 100, side: 'right' };
      const target: PortLocation = { x: 300, y: 300, side: 'bottom' };

      const context: EdgeRoutingContext = {
        sourcePoint: source,
        targetPoint: target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 200, y: 250 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      const points = bezierRouting.computePoints(context);

      expect(points).toHaveLength(4);
      expect(points[0]).toEqual({ x: 100, y: 100 }); // source
      expect(points[1]).toEqual({ x: 200, y: 100 }); // source control (right +100)
      expect(points[2]).toEqual({ x: 300, y: 400 }); // target control (bottom +100)
      expect(points[3]).toEqual({ x: 300, y: 300 }); // target
    });

    it('should handle zero offset', () => {
      const source: PortLocation = { x: 100, y: 200, side: 'right' };
      const target: PortLocation = { x: 400, y: 200, side: 'left' };
      const config: EdgeRoutingConfig = {
        defaultRouting: 'polyline',
        bezier: { bezierControlOffset: 0 },
      };

      const context: EdgeRoutingContext = {
        sourcePoint: source,
        targetPoint: target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 300, y: 0 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      const points = bezierRouting.computePoints(context, config);

      expect(points).toHaveLength(4);
      expect(points[0]).toEqual({ x: 100, y: 200 });
      expect(points[1]).toEqual({ x: 100, y: 200 }); // same as source
      expect(points[2]).toEqual({ x: 400, y: 200 }); // same as target
      expect(points[3]).toEqual({ x: 400, y: 200 });
    });

    it('should handle undefined config', () => {
      const source: PortLocation = { x: 0, y: 0, side: 'right' };
      const target: PortLocation = { x: 200, y: 0, side: 'left' };

      const context: EdgeRoutingContext = {
        sourcePoint: source,
        targetPoint: target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: -50, y: -25 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 150, y: -25 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      const points = bezierRouting.computePoints(context, undefined);

      expect(points).toHaveLength(4);
      // Should use default offset of 100
      expect(points[1]).toEqual({ x: 100, y: 0 });
      expect(points[2]).toEqual({ x: 100, y: 0 });
    });

    it('should handle config without bezier property', () => {
      const source: PortLocation = { x: 0, y: 0, side: 'right' };
      const target: PortLocation = { x: 200, y: 0, side: 'left' };
      const config: EdgeRoutingConfig = { defaultRouting: 'polyline' };

      const context: EdgeRoutingContext = {
        sourcePoint: source,
        targetPoint: target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: -50, y: -25 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 150, y: -25 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      const points = bezierRouting.computePoints(context, config);

      expect(points).toHaveLength(4);
      // Should use default offset of 100
      expect(points[1]).toEqual({ x: 100, y: 0 });
      expect(points[2]).toEqual({ x: 100, y: 0 });
    });
  });

  describe('computeSvgPath', () => {
    it('should generate cubic bezier path for 4 points', () => {
      const points = [
        { x: 0, y: 100 },
        { x: 25, y: 0 },
        { x: 75, y: 0 },
        { x: 100, y: 100 },
      ];

      const path = bezierRouting.computeSvgPath(points);

      expect(path).toBe('M 0,100 C 25,0 75,0 100,100');
    });

    it('should generate line path for 2 points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];

      const path = bezierRouting.computeSvgPath(points);

      expect(path).toBe('M 0,0 L 100,100');
    });

    it('should generate move command for single point', () => {
      const points = [{ x: 50, y: 50 }];

      const path = bezierRouting.computeSvgPath(points);

      expect(path).toBe('M 50,50');
    });

    it('should return empty string for empty array', () => {
      const path = bezierRouting.computeSvgPath([]);

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

      const path = bezierRouting.computeSvgPath(points);

      expect(path).toBe('M 0,0 L 25,50 L 50,25 L 75,75 L 100,100');
    });
  });

  describe('computePointOnPath', () => {
    it('should return start point at 0%', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 75, y: 100 },
        { x: 100, y: 100 },
      ];

      const point = bezierRouting.computePointOnPath(points, 0);

      expect(point).toEqual({ x: 0, y: 0 });
    });

    it('should return end point at 100%', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 75, y: 100 },
        { x: 100, y: 100 },
      ];

      const point = bezierRouting.computePointOnPath(points, 1);

      expect(point).toEqual({ x: 100, y: 100 });
    });

    it('should return midpoint at 50%', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 0, y: 50 },
        { x: 100, y: 50 },
        { x: 100, y: 100 },
      ];

      const point = bezierRouting.computePointOnPath(points, 0.5);

      expect(point).toEqual({ x: 50, y: 50 });
    });

    it('should handle clamping for values outside 0-1', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 75, y: 100 },
        { x: 100, y: 100 },
      ];

      const pointNegative = bezierRouting.computePointOnPath(points, -0.5);
      const pointOverOne = bezierRouting.computePointOnPath(points, 1.5);

      expect(pointNegative).toEqual({ x: 0, y: 0 }); // clamped to 0
      expect(pointOverOne).toEqual({ x: 100, y: 100 }); // clamped to 1
    });

    it('should fall back to linear interpolation for 2 points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];

      const point = bezierRouting.computePointOnPath(points, 0.5);

      expect(point).toEqual({ x: 50, y: 50 });
    });

    it('should return first point for single point', () => {
      const points = [{ x: 50, y: 50 }];

      const point = bezierRouting.computePointOnPath(points, 0.5);

      expect(point).toEqual({ x: 50, y: 50 });
    });

    it('should return (0,0) for empty array', () => {
      const point = bezierRouting.computePointOnPath([], 0.5);

      expect(point).toEqual({ x: 0, y: 0 });
    });
  });

  describe('integration tests', () => {
    it('should work end-to-end from source/target to SVG path', () => {
      const source: PortLocation = { x: 100, y: 200, side: 'right' };
      const target: PortLocation = { x: 400, y: 200, side: 'left' };

      const context: EdgeRoutingContext = {
        sourcePoint: source,
        targetPoint: target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 300, y: 0 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      // Calculate points
      const points = bezierRouting.computePoints(context);

      // Generate SVG path
      const path = bezierRouting.computeSvgPath(points);

      expect(path).toBe('M 100,200 C 200,200 300,200 400,200');
    });

    it('should work with custom configuration', () => {
      const source: PortLocation = { x: 0, y: 0, side: 'bottom' };
      const target: PortLocation = { x: 100, y: 100, side: 'top' };
      const config: EdgeRoutingConfig = {
        defaultRouting: 'polyline',
        bezier: { bezierControlOffset: 25 },
      };

      const context: EdgeRoutingContext = {
        sourcePoint: source,
        targetPoint: target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: -50, y: -25 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 50, y: 75 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      // Calculate points with custom offset
      const points = bezierRouting.computePoints(context, config);

      expect(points).toHaveLength(4);
      expect(points[1]).toEqual({ x: 0, y: 25 }); // source control (bottom +25)
      expect(points[2]).toEqual({ x: 100, y: 75 }); // target control (top -25)

      // Generate SVG path
      const path = bezierRouting.computeSvgPath(points);

      expect(path).toBe('M 0,0 C 0,25 100,75 100,100');

      // Get point on path
      const midPoint = bezierRouting.computePointOnPath(points, 0.5);

      expect(midPoint.x).toBeCloseTo(50, 1);
      expect(midPoint.y).toBeCloseTo(50, 1); // Midpoint for this specific curve
    });

    it('should handle complex routing scenario', () => {
      const source: PortLocation = { x: -50, y: -50, side: 'left' };
      const target: PortLocation = { x: 150, y: 150, side: 'right' };

      const context: EdgeRoutingContext = {
        sourcePoint: source,
        targetPoint: target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: -100, y: -75 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 100, y: 125 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      const points = bezierRouting.computePoints(context);

      expect(points[0]).toEqual({ x: -50, y: -50 });
      expect(points[1]).toEqual({ x: -150, y: -50 }); // left -100
      expect(points[2]).toEqual({ x: 250, y: 150 }); // right +100
      expect(points[3]).toEqual({ x: 150, y: 150 });

      const path = bezierRouting.computeSvgPath(points);
      expect(path).toBe('M -50,-50 C -150,-50 250,150 150,150');

      // Check various points along the path
      const quarterPoint = bezierRouting.computePointOnPath(points, 0.25);
      const halfPoint = bezierRouting.computePointOnPath(points, 0.5);
      const threeQuarterPoint = bezierRouting.computePointOnPath(points, 0.75);

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
