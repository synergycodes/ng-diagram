import { beforeEach, describe, expect, it } from 'vitest';
import { Edge, Node, PortLocation } from '../../../../types';
import { RoutingContext } from '../../../types';
import { StraightRouting } from '../straight-routing';

describe('StraightRouting', () => {
  let straightRouting: StraightRouting;

  beforeEach(() => {
    straightRouting = new StraightRouting();
  });

  describe('name property', () => {
    it('should have name "straight"', () => {
      expect(straightRouting.name).toBe('straight');
    });
  });

  describe('computePoints', () => {
    it('should return two points for straight line', () => {
      const source: PortLocation = { x: 100, y: 200, side: 'right' };
      const target: PortLocation = { x: 400, y: 300, side: 'left' };

      const context: RoutingContext = {
        source,
        target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 300, y: 250 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      const points = straightRouting.computePoints(context);

      expect(points).toHaveLength(2);
      expect(points[0]).toEqual({ x: 100, y: 200 });
      expect(points[1]).toEqual({ x: 400, y: 300 });
    });

    it('should handle same source and target positions', () => {
      const source: PortLocation = { x: 50, y: 50, side: 'right' };
      const target: PortLocation = { x: 50, y: 50, side: 'left' };

      const context: RoutingContext = {
        source,
        target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: 0, y: 25 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 0, y: 25 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      const points = straightRouting.computePoints(context);

      expect(points).toHaveLength(2);
      expect(points[0]).toEqual({ x: 50, y: 50 });
      expect(points[1]).toEqual({ x: 50, y: 50 });
    });

    it('should handle negative coordinates', () => {
      const source: PortLocation = { x: -100, y: -200, side: 'left' };
      const target: PortLocation = { x: -50, y: -150, side: 'right' };

      const context: RoutingContext = {
        source,
        target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: -150, y: -225 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: -100, y: -175 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      const points = straightRouting.computePoints(context);

      expect(points).toHaveLength(2);
      expect(points[0]).toEqual({ x: -100, y: -200 });
      expect(points[1]).toEqual({ x: -50, y: -150 });
    });

    it('should handle decimal coordinates', () => {
      const source: PortLocation = { x: 10.5, y: 20.7, side: 'top' };
      const target: PortLocation = { x: 30.3, y: 40.1, side: 'bottom' };

      const context: RoutingContext = {
        source,
        target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: {
          id: 'node1',
          position: { x: -39.5, y: -4.3 },
          size: { width: 100, height: 50 },
          data: {},
        } as Node,
        targetNode: {
          id: 'node2',
          position: { x: -19.7, y: 15.1 },
          size: { width: 100, height: 50 },
          data: {},
        } as Node,
      };

      const points = straightRouting.computePoints(context);

      expect(points).toHaveLength(2);
      expect(points[0]).toEqual({ x: 10.5, y: 20.7 });
      expect(points[1]).toEqual({ x: 30.3, y: 40.1 });
    });

    it('should handle horizontal line', () => {
      const source: PortLocation = { x: 0, y: 100, side: 'right' };
      const target: PortLocation = { x: 200, y: 100, side: 'left' };

      const context: RoutingContext = {
        source,
        target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: -50, y: 75 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 150, y: 75 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      const points = straightRouting.computePoints(context);

      expect(points[0]).toEqual({ x: 0, y: 100 });
      expect(points[1]).toEqual({ x: 200, y: 100 });
    });

    it('should handle vertical line', () => {
      const source: PortLocation = { x: 100, y: 0, side: 'bottom' };
      const target: PortLocation = { x: 100, y: 200, side: 'top' };

      const context: RoutingContext = {
        source,
        target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: 50, y: -25 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 50, y: 175 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      const points = straightRouting.computePoints(context);

      expect(points[0]).toEqual({ x: 100, y: 0 });
      expect(points[1]).toEqual({ x: 100, y: 200 });
    });
  });

  describe('computeSvgPath', () => {
    it('should generate line path for 2 points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];

      const path = straightRouting.computeSvgPath(points);

      expect(path).toBe('M 0,0 L 100,100');
    });

    it('should generate move command for single point', () => {
      const points = [{ x: 50, y: 75 }];

      const path = straightRouting.computeSvgPath(points);

      expect(path).toBe('M 50,75');
    });

    it('should return empty string for empty array', () => {
      const path = straightRouting.computeSvgPath([]);

      expect(path).toBe('');
    });

    it('should handle multiple points (polyline)', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 25 },
        { x: 100, y: 50 },
        { x: 150, y: 75 },
      ];

      const path = straightRouting.computeSvgPath(points);

      expect(path).toBe('M 0,0 L 50,25 L 100,50 L 150,75');
    });

    it('should handle negative coordinates in path', () => {
      const points = [
        { x: -50, y: -100 },
        { x: 50, y: 100 },
      ];

      const path = straightRouting.computeSvgPath(points);

      expect(path).toBe('M -50,-100 L 50,100');
    });

    it('should handle decimal coordinates in path', () => {
      const points = [
        { x: 10.5, y: 20.25 },
        { x: 30.75, y: 40.5 },
      ];

      const path = straightRouting.computeSvgPath(points);

      expect(path).toBe('M 10.5,20.25 L 30.75,40.5');
    });

    it('should handle zero coordinates', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 0, y: 100 },
      ];

      const path = straightRouting.computeSvgPath(points);

      expect(path).toBe('M 0,0 L 0,100');
    });
  });

  describe('computePointOnPath', () => {
    it('should return start point at 0%', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];

      const point = straightRouting.computePointOnPath(points, 0);

      expect(point).toEqual({ x: 0, y: 0 });
    });

    it('should return end point at 100%', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];

      const point = straightRouting.computePointOnPath(points, 1);

      expect(point).toEqual({ x: 100, y: 100 });
    });

    it('should return midpoint at 50%', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];

      const point = straightRouting.computePointOnPath(points, 0.5);

      expect(point).toEqual({ x: 50, y: 50 });
    });

    it('should return quarter point at 25%', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 200 },
      ];

      const point = straightRouting.computePointOnPath(points, 0.25);

      expect(point).toEqual({ x: 25, y: 50 });
    });

    it('should return three-quarter point at 75%', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 200 },
      ];

      const point = straightRouting.computePointOnPath(points, 0.75);

      expect(point).toEqual({ x: 75, y: 150 });
    });

    it('should clamp percentage below 0', () => {
      const points = [
        { x: 10, y: 20 },
        { x: 110, y: 120 },
      ];

      const point = straightRouting.computePointOnPath(points, -0.5);

      expect(point).toEqual({ x: 10, y: 20 }); // Clamped to start point
    });

    it('should clamp percentage above 1', () => {
      const points = [
        { x: 10, y: 20 },
        { x: 110, y: 120 },
      ];

      const point = straightRouting.computePointOnPath(points, 1.5);

      expect(point).toEqual({ x: 110, y: 120 }); // Clamped to end point
    });

    it('should handle single point', () => {
      const points = [{ x: 50, y: 75 }];

      const point = straightRouting.computePointOnPath(points, 0.5);

      expect(point).toEqual({ x: 50, y: 75 });
    });

    it('should return (0,0) for empty array', () => {
      const point = straightRouting.computePointOnPath([], 0.5);

      expect(point).toEqual({ x: 0, y: 0 });
    });

    it('should handle negative coordinates', () => {
      const points = [
        { x: -100, y: -50 },
        { x: 100, y: 50 },
      ];

      const point = straightRouting.computePointOnPath(points, 0.5);

      expect(point).toEqual({ x: 0, y: 0 });
    });

    it('should handle decimal coordinates', () => {
      const points = [
        { x: 10.5, y: 20.5 },
        { x: 30.5, y: 40.5 },
      ];

      const point = straightRouting.computePointOnPath(points, 0.5);

      expect(point).toEqual({ x: 20.5, y: 30.5 });
    });

    it('should handle horizontal line', () => {
      const points = [
        { x: 0, y: 50 },
        { x: 100, y: 50 },
      ];

      const point = straightRouting.computePointOnPath(points, 0.5);

      expect(point).toEqual({ x: 50, y: 50 });
    });

    it('should handle vertical line', () => {
      const points = [
        { x: 50, y: 0 },
        { x: 50, y: 100 },
      ];

      const point = straightRouting.computePointOnPath(points, 0.5);

      expect(point).toEqual({ x: 50, y: 50 });
    });

    it('should use first and last points for multi-point path', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 25 },
        { x: 75, y: 80 },
        { x: 100, y: 100 },
      ];

      const point = straightRouting.computePointOnPath(points, 0.5);

      // Should interpolate between first and last, ignoring middle points
      expect(point).toEqual({ x: 50, y: 50 });
    });
  });

  describe('integration tests', () => {
    it('should work end-to-end from source/target to SVG path', () => {
      const source: PortLocation = { x: 10, y: 20, side: 'right' };
      const target: PortLocation = { x: 90, y: 80, side: 'left' };

      const context: RoutingContext = {
        source,
        target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: -40, y: -5 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 40, y: 55 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      // Calculate points
      const points = straightRouting.computePoints(context);
      expect(points).toHaveLength(2);

      // Generate SVG path
      const path = straightRouting.computeSvgPath(points);
      expect(path).toBe('M 10,20 L 90,80');

      // Get point on path
      const midPoint = straightRouting.computePointOnPath(points, 0.5);
      expect(midPoint).toEqual({ x: 50, y: 50 });
    });

    it('should handle complex scenario with negative coordinates', () => {
      const source: PortLocation = { x: -50, y: -100, side: 'top' };
      const target: PortLocation = { x: 150, y: 200, side: 'bottom' };

      const context: RoutingContext = {
        source,
        target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: -100, y: -125 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 100, y: 175 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      const points = straightRouting.computePoints(context);
      const path = straightRouting.computeSvgPath(points);

      expect(path).toBe('M -50,-100 L 150,200');

      // Check various points along the path
      const point25 = straightRouting.computePointOnPath(points, 0.25);
      const point50 = straightRouting.computePointOnPath(points, 0.5);
      const point75 = straightRouting.computePointOnPath(points, 0.75);

      expect(point25).toEqual({ x: 0, y: -25 });
      expect(point50).toEqual({ x: 50, y: 50 });
      expect(point75).toEqual({ x: 100, y: 125 });
    });

    it('should handle edge case with same start and end point', () => {
      const source: PortLocation = { x: 100, y: 100, side: 'right' };
      const target: PortLocation = { x: 100, y: 100, side: 'left' };

      const context: RoutingContext = {
        source,
        target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: 50, y: 75 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 50, y: 75 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      const points = straightRouting.computePoints(context);
      const path = straightRouting.computeSvgPath(points);

      expect(path).toBe('M 100,100 L 100,100');

      // Any percentage should return the same point
      expect(straightRouting.computePointOnPath(points, 0)).toEqual({ x: 100, y: 100 });
      expect(straightRouting.computePointOnPath(points, 0.5)).toEqual({ x: 100, y: 100 });
      expect(straightRouting.computePointOnPath(points, 1)).toEqual({ x: 100, y: 100 });
    });

    it('should properly clamp out-of-range percentages', () => {
      const source: PortLocation = { x: 0, y: 0, side: 'right' };
      const target: PortLocation = { x: 100, y: 0, side: 'left' };

      const context: RoutingContext = {
        source,
        target,
        edge: { id: 'test-edge', source: 'node1', target: 'node2', data: {} } as Edge,
        sourceNode: { id: 'node1', position: { x: -50, y: -25 }, size: { width: 100, height: 50 }, data: {} } as Node,
        targetNode: { id: 'node2', position: { x: 50, y: -25 }, size: { width: 100, height: 50 }, data: {} } as Node,
      };

      const points = straightRouting.computePoints(context);

      // Test clamping behavior
      const pointNeg2 = straightRouting.computePointOnPath(points, -2);
      const pointNeg05 = straightRouting.computePointOnPath(points, -0.5);
      const point0 = straightRouting.computePointOnPath(points, 0);
      const point1 = straightRouting.computePointOnPath(points, 1);
      const point15 = straightRouting.computePointOnPath(points, 1.5);
      const point10 = straightRouting.computePointOnPath(points, 10);

      // All negative values should clamp to start
      expect(pointNeg2).toEqual({ x: 0, y: 0 });
      expect(pointNeg05).toEqual({ x: 0, y: 0 });
      expect(point0).toEqual({ x: 0, y: 0 });

      // All values > 1 should clamp to end
      expect(point1).toEqual({ x: 100, y: 0 });
      expect(point15).toEqual({ x: 100, y: 0 });
      expect(point10).toEqual({ x: 100, y: 0 });
    });
  });
});
