import { beforeEach, describe, expect, it } from 'vitest';
import { Edge, Node, PortLocation } from '../../../../types';
import { RoutingContext } from '../../../types';
import { PolynomialRouting } from '../polynomial-routing';

describe('PolynomialRouting', () => {
  let routing: PolynomialRouting;
  let mockContext: RoutingContext;

  beforeEach(() => {
    routing = new PolynomialRouting();

    const sourceNode: Node = {
      id: 'node1',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 50 },
      data: {},
    };

    const targetNode: Node = {
      id: 'node2',
      position: { x: 300, y: 200 },
      size: { width: 100, height: 50 },
      data: {},
    };

    const edge: Edge = {
      id: 'edge1',
      source: 'node1',
      target: 'node2',
      data: {},
    };

    const source: PortLocation = {
      x: 100,
      y: 25,
      side: 'right',
    };

    const target: PortLocation = {
      x: 300,
      y: 225,
      side: 'left',
    };

    mockContext = {
      source,
      target,
      edge,
      sourceNode,
      targetNode,
    };
  });

  describe('computePoints', () => {
    it('should return straight line when no intermediate points provided', () => {
      const points = routing.computePoints(mockContext);

      expect(points).toHaveLength(2);
      expect(points[0]).toEqual({ x: 100, y: 25 });
      expect(points[1]).toEqual({ x: 300, y: 225 });
    });

    it('should use manual points when provided with more than 2 points', () => {
      mockContext.edge.points = [
        { x: 100, y: 25 },
        { x: 150, y: 50 },
        { x: 200, y: 100 },
        { x: 250, y: 150 },
        { x: 300, y: 225 },
      ];

      const points = routing.computePoints(mockContext);

      expect(points).toHaveLength(5);
      // Source and target should be replaced with actual positions
      expect(points[0]).toEqual({ x: 100, y: 25 });
      expect(points[1]).toEqual({ x: 150, y: 50 });
      expect(points[2]).toEqual({ x: 200, y: 100 });
      expect(points[3]).toEqual({ x: 250, y: 150 });
      expect(points[4]).toEqual({ x: 300, y: 225 });
    });

    it('should replace first and last points with source and target positions', () => {
      mockContext.edge.points = [
        { x: 0, y: 0 }, // Will be replaced
        { x: 150, y: 100 },
        { x: 250, y: 150 },
        { x: 0, y: 0 }, // Will be replaced
      ];

      const points = routing.computePoints(mockContext);

      expect(points[0]).toEqual({ x: 100, y: 25 }); // Source position
      expect(points[3]).toEqual({ x: 300, y: 225 }); // Target position
      expect(points[1]).toEqual({ x: 150, y: 100 });
      expect(points[2]).toEqual({ x: 250, y: 150 });
    });
  });

  describe('computeSvgPath', () => {
    it('should return empty string for empty points array', () => {
      const path = routing.computeSvgPath([]);
      expect(path).toBe('');
    });

    it('should return single point path for single point', () => {
      const points = [{ x: 100, y: 50 }];
      const path = routing.computeSvgPath(points);
      expect(path).toBe('M 100,50');
    });

    it('should create polyline path for multiple points', () => {
      const points = [
        { x: 100, y: 25 },
        { x: 150, y: 50 },
        { x: 200, y: 100 },
        { x: 300, y: 225 },
      ];
      const path = routing.computeSvgPath(points);
      expect(path).toBe('M 100,25 L 150,50 L 200,100 L 300,225');
    });
  });

  describe('computePointOnPath', () => {
    it('should return first point when percentage is 0', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ];
      const point = routing.computePointOnPath(points, 0);
      expect(point).toEqual({ x: 0, y: 0 });
    });

    it('should return last point when percentage is 1', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ];
      const point = routing.computePointOnPath(points, 1);
      expect(point).toEqual({ x: 100, y: 100 });
    });

    it('should interpolate correctly along multiple segments', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ];
      // Total path length: 100 + 100 = 200
      // At 0.25 (25%), should be at distance 50 on first segment
      const point = routing.computePointOnPath(points, 0.25);
      expect(point).toEqual({ x: 50, y: 0 });
    });

    it('should handle single point', () => {
      const points = [{ x: 100, y: 50 }];
      const point = routing.computePointOnPath(points, 0.5);
      expect(point).toEqual({ x: 100, y: 50 });
    });

    it('should handle empty array', () => {
      const point = routing.computePointOnPath([], 0.5);
      expect(point).toEqual({ x: 0, y: 0 });
    });

    it('should clamp percentage to valid range', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];

      const pointNegative = routing.computePointOnPath(points, -0.5);
      expect(pointNegative).toEqual({ x: 0, y: 0 });

      const pointOverOne = routing.computePointOnPath(points, 1.5);
      expect(pointOverOne).toEqual({ x: 100, y: 0 });
    });

    it('should correctly calculate point on second segment', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ];
      // Total path length: 100 + 100 = 200
      // At 0.75 (75%), should be at distance 150, which is 50 units into second segment
      const point = routing.computePointOnPath(points, 0.75);
      expect(point).toEqual({ x: 100, y: 50 });
    });
  });

  describe('name property', () => {
    it('should have name "polynomial"', () => {
      expect(routing.name).toBe('polynomial');
    });
  });
});
