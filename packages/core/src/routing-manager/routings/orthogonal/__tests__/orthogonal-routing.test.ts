import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Point, PortSide } from '../../../../types';
import * as computeOrthogonalPathModule from '../compute-orthogonal-path';
import * as computeOrthogonalPointOnPathModule from '../compute-orthogonal-point-on-path';
import * as computeOrthogonalPointsModule from '../compute-orthogonal-points';
import { OrthogonalRouting } from '../orthogonal-routing';

vi.mock('../compute-orthogonal-path');
vi.mock('../compute-orthogonal-point-on-path');
vi.mock('../compute-orthogonal-points');

describe('OrthogonalRouting', () => {
  let routing: OrthogonalRouting;

  beforeEach(() => {
    routing = new OrthogonalRouting();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance with correct name', () => {
      expect(routing).toBeDefined();
      expect(routing.name).toBe('orthogonal');
    });

    it('should implement Routing interface', () => {
      expect(routing).toHaveProperty('name');
      expect(routing).toHaveProperty('computePoints');
      expect(routing).toHaveProperty('computeSvgPath');
      expect(routing).toHaveProperty('computePointOnPath');
    });
  });

  describe('computePoints', () => {
    it('should call computeOrthogonalPoints with default firstLastSegmentLength', () => {
      const source = { x: 10, y: 20, side: 'left' as PortSide };
      const target = { x: 100, y: 120, side: 'right' as PortSide };
      const expectedPoints = [
        { x: 10, y: 20 },
        { x: 55, y: 20 },
        { x: 55, y: 120 },
        { x: 100, y: 120 },
      ];

      const spy = vi.spyOn(computeOrthogonalPointsModule, 'computeOrthogonalPoints');
      spy.mockReturnValue(expectedPoints);

      const result = routing.computePoints(source, target);

      expect(spy).toHaveBeenCalledWith(source, target, 20);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedPoints);
    });

    it('should call computeOrthogonalPoints with custom firstLastSegmentLength from config', () => {
      const source = { x: 10, y: 20, side: 'left' as PortSide };
      const target = { x: 100, y: 120, side: 'right' as PortSide };
      const config = { orthogonal: { firstLastSegmentLength: 30 } };
      const expectedPoints = [
        { x: 10, y: 20 },
        { x: 55, y: 20 },
        { x: 55, y: 120 },
        { x: 100, y: 120 },
      ];

      const spy = vi.spyOn(computeOrthogonalPointsModule, 'computeOrthogonalPoints');
      spy.mockReturnValue(expectedPoints);

      const result = routing.computePoints(source, target, config);

      expect(spy).toHaveBeenCalledWith(source, target, 30);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedPoints);
    });

    it('should use default firstLastSegmentLength when config value is negative', () => {
      const source = { x: 10, y: 20, side: 'left' as PortSide };
      const target = { x: 100, y: 120, side: 'right' as PortSide };
      const config = { orthogonal: { firstLastSegmentLength: -10 } };
      const expectedPoints = [
        { x: 10, y: 20 },
        { x: 55, y: 20 },
        { x: 55, y: 120 },
        { x: 100, y: 120 },
      ];

      const spy = vi.spyOn(computeOrthogonalPointsModule, 'computeOrthogonalPoints');
      spy.mockReturnValue(expectedPoints);

      const result = routing.computePoints(source, target, config);

      expect(spy).toHaveBeenCalledWith(source, target, 20); // Should use default 20
      expect(result).toEqual(expectedPoints);
    });

    it('should accept zero as valid firstLastSegmentLength', () => {
      const source = { x: 10, y: 20, side: 'left' as PortSide };
      const target = { x: 100, y: 120, side: 'right' as PortSide };
      const config = { orthogonal: { firstLastSegmentLength: 0 } };
      const expectedPoints = [
        { x: 10, y: 20 },
        { x: 55, y: 20 },
        { x: 55, y: 120 },
        { x: 100, y: 120 },
      ];

      const spy = vi.spyOn(computeOrthogonalPointsModule, 'computeOrthogonalPoints');
      spy.mockReturnValue(expectedPoints);

      const result = routing.computePoints(source, target, config);

      expect(spy).toHaveBeenCalledWith(source, target, 0);
      expect(result).toEqual(expectedPoints);
    });

    it('should handle different port sides', () => {
      const testCases = [
        { source: { x: 0, y: 0, side: 'top' as PortSide }, target: { x: 100, y: 100, side: 'bottom' as PortSide } },
        { source: { x: 0, y: 0, side: 'bottom' as PortSide }, target: { x: 100, y: 100, side: 'top' as PortSide } },
        { source: { x: 0, y: 0, side: 'left' as PortSide }, target: { x: 100, y: 100, side: 'left' as PortSide } },
        { source: { x: 0, y: 0, side: 'right' as PortSide }, target: { x: 100, y: 100, side: 'right' as PortSide } },
      ];

      const spy = vi.spyOn(computeOrthogonalPointsModule, 'computeOrthogonalPoints');
      spy.mockReturnValue([
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ]);

      testCases.forEach((testCase) => {
        routing.computePoints(testCase.source, testCase.target);
        expect(spy).toHaveBeenCalledWith(testCase.source, testCase.target, 20);
      });

      expect(spy).toHaveBeenCalledTimes(testCases.length);
    });

    it('should handle same source and target positions', () => {
      const source = { x: 50, y: 50, side: 'top' as PortSide };
      const target = { x: 50, y: 50, side: 'bottom' as PortSide };

      const spy = vi.spyOn(computeOrthogonalPointsModule, 'computeOrthogonalPoints');
      spy.mockReturnValue([
        { x: 50, y: 50 },
        { x: 50, y: 30 },
        { x: 50, y: 70 },
        { x: 50, y: 50 },
      ]);

      const result = routing.computePoints(source, target);

      expect(spy).toHaveBeenCalledWith(source, target, 20);
      expect(result).toHaveLength(4);
    });

    it('should handle negative coordinates', () => {
      const source = { x: -50, y: -100, side: 'left' as PortSide };
      const target = { x: 50, y: 100, side: 'right' as PortSide };

      const spy = vi.spyOn(computeOrthogonalPointsModule, 'computeOrthogonalPoints');
      spy.mockReturnValue([
        { x: -50, y: -100 },
        { x: 0, y: -100 },
        { x: 0, y: 100 },
        { x: 50, y: 100 },
      ]);

      const result = routing.computePoints(source, target);

      expect(spy).toHaveBeenCalledWith(source, target, 20);
      expect(result[0]).toEqual({ x: -50, y: -100 });
      expect(result[result.length - 1]).toEqual({ x: 50, y: 100 });
    });
  });

  describe('computeSvgPath', () => {
    it('should call computeOrthogonalPath with correct points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 100 },
        { x: 100, y: 100 },
      ];
      const expectedPath = 'M 0,0 L34,0 A16,16,0,0,1,50,16 L50,84 A16,16,0,0,0,66,100 L 100,100';

      const spy = vi.spyOn(computeOrthogonalPathModule, 'computeOrthogonalPath');
      spy.mockReturnValue(expectedPath);

      const result = routing.computeSvgPath(points);

      expect(spy).toHaveBeenCalledWith(points, 16);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(result).toBe(expectedPath);
    });

    it('should handle empty points array', () => {
      const points: Point[] = [];
      const expectedPath = '';

      const spy = vi.spyOn(computeOrthogonalPathModule, 'computeOrthogonalPath');
      spy.mockReturnValue(expectedPath);

      const result = routing.computeSvgPath(points);

      expect(spy).toHaveBeenCalledWith(points, 16);
      expect(result).toBe('');
    });

    it('should handle single point', () => {
      const points = [{ x: 50, y: 50 }];
      const expectedPath = 'M 50,50';

      const spy = vi.spyOn(computeOrthogonalPathModule, 'computeOrthogonalPath');
      spy.mockReturnValue(expectedPath);

      const result = routing.computeSvgPath(points);

      expect(spy).toHaveBeenCalledWith(points, 16);
      expect(result).toBe(expectedPath);
    });

    it('should handle straight line (two points)', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];
      const expectedPath = 'M 0,0 L 100,0';

      const spy = vi.spyOn(computeOrthogonalPathModule, 'computeOrthogonalPath');
      spy.mockReturnValue(expectedPath);

      const result = routing.computeSvgPath(points);

      expect(spy).toHaveBeenCalledWith(points, 16);
      expect(result).toBe(expectedPath);
    });

    it('should handle complex orthogonal path', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 50 },
        { x: 100, y: 100 },
        { x: 150, y: 100 },
      ];
      const expectedPath =
        'M 0,0 L34,0 A16,16,0,0,1,50,16 L50,34 A16,16,0,0,0,66,50 L84,50 A16,16,0,0,1,100,66 L100,84 A16,16,0,0,0,116,100 L 150,100';

      const spy = vi.spyOn(computeOrthogonalPathModule, 'computeOrthogonalPath');
      spy.mockReturnValue(expectedPath);

      const result = routing.computeSvgPath(points);

      expect(spy).toHaveBeenCalledWith(points, 16);
      expect(result).toBe(expectedPath);
    });

    it('should use custom maxCornerRadius from config', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 100 },
        { x: 100, y: 100 },
      ];
      const config = { orthogonal: { maxCornerRadius: 25 } };
      const expectedPath = 'M 0,0 L25,0 A25,25,0,0,1,50,25 L50,75 A25,25,0,0,0,75,100 L 100,100';

      const spy = vi.spyOn(computeOrthogonalPathModule, 'computeOrthogonalPath');
      spy.mockReturnValue(expectedPath);

      const result = routing.computeSvgPath(points, config);

      expect(spy).toHaveBeenCalledWith(points, 25);
      expect(result).toBe(expectedPath);
    });

    it('should use default maxCornerRadius when config value is negative', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 100 },
        { x: 100, y: 100 },
      ];
      const config = { orthogonal: { maxCornerRadius: -5 } };
      const expectedPath = 'M 0,0 L16,0 A16,16,0,0,1,50,16 L50,84 A16,16,0,0,0,66,100 L 100,100';

      const spy = vi.spyOn(computeOrthogonalPathModule, 'computeOrthogonalPath');
      spy.mockReturnValue(expectedPath);

      const result = routing.computeSvgPath(points, config);

      expect(spy).toHaveBeenCalledWith(points, 16); // Should use default 16
      expect(result).toBe(expectedPath);
    });

    it('should accept zero as valid maxCornerRadius', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 100 },
        { x: 100, y: 100 },
      ];
      const config = { orthogonal: { maxCornerRadius: 0 } };
      const expectedPath = 'M 0,0 L 50,0 L 50,100 L 100,100'; // No rounded corners

      const spy = vi.spyOn(computeOrthogonalPathModule, 'computeOrthogonalPath');
      spy.mockReturnValue(expectedPath);

      const result = routing.computeSvgPath(points, config);

      expect(spy).toHaveBeenCalledWith(points, 0);
      expect(result).toBe(expectedPath);
    });
  });

  describe('computePointOnPath', () => {
    it('should call computeOrthogonalPointOnPath with correct parameters', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ];
      const percentage = 0.5;
      const expectedPoint = { x: 100, y: 0 };

      const spy = vi.spyOn(computeOrthogonalPointOnPathModule, 'computeOrthogonalPointOnPath');
      spy.mockReturnValue(expectedPoint);

      const result = routing.computePointOnPath(points, percentage);

      expect(spy).toHaveBeenCalledWith(points, percentage);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedPoint);
    });

    it('should handle percentage at 0', () => {
      const points = [
        { x: 10, y: 20 },
        { x: 50, y: 20 },
        { x: 50, y: 60 },
      ];
      const expectedPoint = { x: 10, y: 20 };

      const spy = vi.spyOn(computeOrthogonalPointOnPathModule, 'computeOrthogonalPointOnPath');
      spy.mockReturnValue(expectedPoint);

      const result = routing.computePointOnPath(points, 0);

      expect(spy).toHaveBeenCalledWith(points, 0);
      expect(result).toEqual(expectedPoint);
    });

    it('should handle percentage at 1', () => {
      const points = [
        { x: 10, y: 20 },
        { x: 50, y: 20 },
        { x: 50, y: 60 },
      ];
      const expectedPoint = { x: 50, y: 60 };

      const spy = vi.spyOn(computeOrthogonalPointOnPathModule, 'computeOrthogonalPointOnPath');
      spy.mockReturnValue(expectedPoint);

      const result = routing.computePointOnPath(points, 1);

      expect(spy).toHaveBeenCalledWith(points, 1);
      expect(result).toEqual(expectedPoint);
    });

    it('should handle various percentages', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 200, y: 100 },
      ];

      const testCases = [
        { percentage: 0.25, expected: { x: 75, y: 0 } },
        { percentage: 0.5, expected: { x: 100, y: 50 } },
        { percentage: 0.75, expected: { x: 150, y: 100 } },
      ];

      const spy = vi.spyOn(computeOrthogonalPointOnPathModule, 'computeOrthogonalPointOnPath');

      testCases.forEach((testCase) => {
        spy.mockReturnValue(testCase.expected);
        const result = routing.computePointOnPath(points, testCase.percentage);
        expect(spy).toHaveBeenCalledWith(points, testCase.percentage);
        expect(result).toEqual(testCase.expected);
      });

      expect(spy).toHaveBeenCalledTimes(testCases.length);
    });

    it('should handle empty points array', () => {
      const points: Point[] = [];
      const expectedPoint = { x: 0, y: 0 };

      const spy = vi.spyOn(computeOrthogonalPointOnPathModule, 'computeOrthogonalPointOnPath');
      spy.mockReturnValue(expectedPoint);

      const result = routing.computePointOnPath(points, 0.5);

      expect(spy).toHaveBeenCalledWith(points, 0.5);
      expect(result).toEqual(expectedPoint);
    });

    it('should handle negative percentage', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];
      const expectedPoint = { x: 0, y: 0 };

      const spy = vi.spyOn(computeOrthogonalPointOnPathModule, 'computeOrthogonalPointOnPath');
      spy.mockReturnValue(expectedPoint);

      const result = routing.computePointOnPath(points, -0.5);

      expect(spy).toHaveBeenCalledWith(points, -0.5);
      expect(result).toEqual(expectedPoint);
    });

    it('should handle percentage greater than 1', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];
      const expectedPoint = { x: 100, y: 100 };

      const spy = vi.spyOn(computeOrthogonalPointOnPathModule, 'computeOrthogonalPointOnPath');
      spy.mockReturnValue(expectedPoint);

      const result = routing.computePointOnPath(points, 1.5);

      expect(spy).toHaveBeenCalledWith(points, 1.5);
      expect(result).toEqual(expectedPoint);
    });
  });

  describe('integration-like tests', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should work with actual implementations for simple L-shape', () => {
      const routing = new OrthogonalRouting();
      const source = { x: 0, y: 0, side: 'right' as PortSide };
      const target = { x: 100, y: 100, side: 'bottom' as PortSide };

      const points = routing.computePoints(source, target);
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThanOrEqual(2);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[points.length - 1]).toEqual({ x: 100, y: 100 });

      const svgPath = routing.computeSvgPath(points);
      expect(svgPath).toBeDefined();
      expect(svgPath).toContain('M');

      const pointOnPath = routing.computePointOnPath(points, 0.5);
      expect(pointOnPath).toBeDefined();
      expect(pointOnPath).toHaveProperty('x');
      expect(pointOnPath).toHaveProperty('y');
    });

    it('should produce valid routing for various configurations', () => {
      const routing = new OrthogonalRouting();
      const configurations = [
        { source: { x: 0, y: 50, side: 'right' as PortSide }, target: { x: 100, y: 50, side: 'left' as PortSide } },
        { source: { x: 50, y: 0, side: 'bottom' as PortSide }, target: { x: 50, y: 100, side: 'top' as PortSide } },
        { source: { x: 0, y: 0, side: 'bottom' as PortSide }, target: { x: 100, y: 100, side: 'top' as PortSide } },
        { source: { x: 100, y: 100, side: 'left' as PortSide }, target: { x: 0, y: 0, side: 'right' as PortSide } },
      ];

      configurations.forEach((config) => {
        const points = routing.computePoints(config.source, config.target);
        const svgPath = routing.computeSvgPath(points);
        const midPoint = routing.computePointOnPath(points, 0.5);

        expect(points).toBeDefined();
        expect(points.length).toBeGreaterThanOrEqual(2);
        expect(svgPath).toBeDefined();
        expect(midPoint).toBeDefined();
      });
    });
  });

  describe('Routing interface compliance', () => {
    it('should have all required Routing interface properties', () => {
      expect(typeof routing.name).toBe('string');
      expect(typeof routing.computePoints).toBe('function');
      expect(typeof routing.computeSvgPath).toBe('function');
      expect(typeof routing.computePointOnPath).toBe('function');
    });

    it('should have correct method signatures', () => {
      expect(routing.computePoints.length).toBe(3); // Now accepts optional config
      expect(routing.computeSvgPath.length).toBe(2); // Now accepts optional config
      expect(routing.computePointOnPath.length).toBe(2);
    });

    it('should return correct types from methods', () => {
      vi.restoreAllMocks();
      const routing = new OrthogonalRouting();

      const source = { x: 0, y: 0, side: 'left' as PortSide };
      const target = { x: 100, y: 100, side: 'right' as PortSide };

      const points = routing.computePoints(source, target);
      expect(Array.isArray(points)).toBe(true);

      const svgPath = routing.computeSvgPath(points);
      expect(typeof svgPath).toBe('string');

      const pointOnPath = routing.computePointOnPath(points, 0.5);
      expect(pointOnPath).toHaveProperty('x');
      expect(pointOnPath).toHaveProperty('y');
      expect(typeof pointOnPath.x).toBe('number');
      expect(typeof pointOnPath.y).toBe('number');
    });
  });
});
