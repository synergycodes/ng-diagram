import { beforeEach, describe, expect, it } from 'vitest';
import { Edge, Node, PortLocation } from '../../../../types';
import { EdgeRoutingContext } from '../../../types';
import { PolylineRouting } from '../polyline-routing';

describe('PolylineRouting', () => {
  let routing: PolylineRouting;

  const createContext = (
    sourcePos: PortLocation,
    targetPos: PortLocation,
    edge?: Partial<Edge>
  ): EdgeRoutingContext => ({
    sourcePoint: sourcePos,
    targetPoint: targetPos,
    edge: { id: 'edge1', source: 'node1', target: 'node2', data: {}, ...edge } as Edge,
    sourceNode: { id: 'node1', position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, data: {} } as Node,
    targetNode: { id: 'node2', position: { x: 300, y: 0 }, size: { width: 100, height: 50 }, data: {} } as Node,
  });

  beforeEach(() => {
    routing = new PolylineRouting();
  });

  describe('computePoints', () => {
    it('should return straight line (2 points) in auto mode', () => {
      const source: PortLocation = { x: 100, y: 50, side: 'right' };
      const target: PortLocation = { x: 300, y: 50, side: 'left' };
      const context = createContext(source, target);

      const points = routing.computePoints(context);

      expect(points).toHaveLength(2);
      expect(points[0]).toEqual({ x: 100, y: 50 });
      expect(points[1]).toEqual({ x: 300, y: 50 });
    });

    it('should use manual points when in manual mode with more than 2 points', () => {
      const source: PortLocation = { x: 100, y: 50, side: 'right' };
      const target: PortLocation = { x: 300, y: 150, side: 'left' };
      const manualPoints = [
        { x: 0, y: 0 },
        { x: 150, y: 50 },
        { x: 250, y: 150 },
        { x: 999, y: 999 },
      ];
      const context = createContext(source, target, {
        routingMode: 'manual',
        points: manualPoints,
      });

      const points = routing.computePoints(context);

      expect(points).toHaveLength(4);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[1]).toEqual({ x: 150, y: 50 });
      expect(points[2]).toEqual({ x: 250, y: 150 });
      expect(points[3]).toEqual({ x: 999, y: 999 });
    });

    it('should handle undefined routing mode (defaults to auto)', () => {
      const source: PortLocation = { x: 0, y: 0, side: 'right' };
      const target: PortLocation = { x: 100, y: 100, side: 'left' };
      const context = createContext(source, target, {
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 50 },
          { x: 100, y: 100 },
        ],
      });

      const points = routing.computePoints(context);

      expect(points).toHaveLength(2);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[1]).toEqual({ x: 100, y: 100 });
    });
  });

  describe('computeSvgPath', () => {
    it('should generate SVG path for 2 points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];

      const path = routing.computeSvgPath(points);

      expect(path).toBe('M 0,0 L 100,100');
    });

    it('should generate SVG path for multiple points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 50 },
      ];

      const path = routing.computeSvgPath(points);

      expect(path).toBe('M 0,0 L 50,0 L 50,50 L 100,50');
    });

    it('should handle single point', () => {
      const points = [{ x: 50, y: 50 }];

      const path = routing.computeSvgPath(points);

      expect(path).toBe('M 50,50');
    });

    it('should handle empty points array', () => {
      const points: { x: number; y: number }[] = [];

      const path = routing.computeSvgPath(points);

      expect(path).toBe('');
    });

    it('should generate path with negative coordinates', () => {
      const points = [
        { x: -10, y: -20 },
        { x: 30, y: -40 },
        { x: 50, y: 60 },
      ];

      const path = routing.computeSvgPath(points);

      expect(path).toBe('M -10,-20 L 30,-40 L 50,60');
    });

    it('should generate path with decimal coordinates', () => {
      const points = [
        { x: 10.5, y: 20.3 },
        { x: 45.7, y: 89.2 },
      ];

      const path = routing.computeSvgPath(points);

      expect(path).toBe('M 10.5,20.3 L 45.7,89.2');
    });
  });

  describe('computePointOnPath', () => {
    it('should compute point at start (0%)', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];

      const point = routing.computePointOnPath(points, 0);

      expect(point).toEqual({ x: 0, y: 0 });
    });

    it('should compute point at middle (50%)', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];

      const point = routing.computePointOnPath(points, 0.5);

      expect(point).toEqual({ x: 50, y: 0 });
    });

    it('should compute point at end (100%)', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];

      const point = routing.computePointOnPath(points, 1);

      expect(point).toEqual({ x: 100, y: 0 });
    });

    it('should compute point on multi-segment path', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ];

      // At 25% - should be halfway on first segment
      let point = routing.computePointOnPath(points, 0.25);
      expect(point).toEqual({ x: 50, y: 0 });

      // At 50% - should be at the middle point
      point = routing.computePointOnPath(points, 0.5);
      expect(point).toEqual({ x: 100, y: 0 });

      // At 75% - should be halfway on second segment
      point = routing.computePointOnPath(points, 0.75);
      expect(point).toEqual({ x: 100, y: 50 });
    });

    it('should clamp percentage values outside 0-1 range', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];

      expect(routing.computePointOnPath(points, -0.5)).toEqual({ x: 0, y: 0 });
      expect(routing.computePointOnPath(points, 1.5)).toEqual({ x: 100, y: 0 });
    });

    it('should handle single point', () => {
      const points = [{ x: 50, y: 50 }];

      expect(routing.computePointOnPath(points, 0)).toEqual({ x: 50, y: 50 });
      expect(routing.computePointOnPath(points, 0.5)).toEqual({ x: 50, y: 50 });
      expect(routing.computePointOnPath(points, 1)).toEqual({ x: 50, y: 50 });
    });

    it('should handle empty points array', () => {
      const points: { x: number; y: number }[] = [];

      expect(routing.computePointOnPath(points, 0.5)).toEqual({ x: 0, y: 0 });
    });
  });
});
