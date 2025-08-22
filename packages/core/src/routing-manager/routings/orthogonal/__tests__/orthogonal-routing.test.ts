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
      expect(routing).toHaveProperty('calculatePoints');
      expect(routing).toHaveProperty('generateSvgPath');
      expect(routing).toHaveProperty('getPointOnPath');
    });
  });

  describe('calculatePoints', () => {
    it('should call computeOrthogonalPoints with correct parameters', () => {
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

      const result = routing.calculatePoints(source, target);

      expect(spy).toHaveBeenCalledWith(source, target);
      expect(spy).toHaveBeenCalledTimes(1);
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
        routing.calculatePoints(testCase.source, testCase.target);
        expect(spy).toHaveBeenCalledWith(testCase.source, testCase.target);
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

      const result = routing.calculatePoints(source, target);

      expect(spy).toHaveBeenCalledWith(source, target);
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

      const result = routing.calculatePoints(source, target);

      expect(spy).toHaveBeenCalledWith(source, target);
      expect(result[0]).toEqual({ x: -50, y: -100 });
      expect(result[result.length - 1]).toEqual({ x: 50, y: 100 });
    });
  });

  describe('generateSvgPath', () => {
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

      const result = routing.generateSvgPath(points);

      expect(spy).toHaveBeenCalledWith(points);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(result).toBe(expectedPath);
    });

    it('should handle empty points array', () => {
      const points: Point[] = [];
      const expectedPath = '';

      const spy = vi.spyOn(computeOrthogonalPathModule, 'computeOrthogonalPath');
      spy.mockReturnValue(expectedPath);

      const result = routing.generateSvgPath(points);

      expect(spy).toHaveBeenCalledWith(points);
      expect(result).toBe('');
    });

    it('should handle single point', () => {
      const points = [{ x: 50, y: 50 }];
      const expectedPath = 'M 50,50';

      const spy = vi.spyOn(computeOrthogonalPathModule, 'computeOrthogonalPath');
      spy.mockReturnValue(expectedPath);

      const result = routing.generateSvgPath(points);

      expect(spy).toHaveBeenCalledWith(points);
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

      const result = routing.generateSvgPath(points);

      expect(spy).toHaveBeenCalledWith(points);
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

      const result = routing.generateSvgPath(points);

      expect(spy).toHaveBeenCalledWith(points);
      expect(result).toBe(expectedPath);
    });
  });

  describe('getPointOnPath', () => {
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

      const result = routing.getPointOnPath(points, percentage);

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

      const result = routing.getPointOnPath(points, 0);

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

      const result = routing.getPointOnPath(points, 1);

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
        const result = routing.getPointOnPath(points, testCase.percentage);
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

      const result = routing.getPointOnPath(points, 0.5);

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

      const result = routing.getPointOnPath(points, -0.5);

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

      const result = routing.getPointOnPath(points, 1.5);

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

      const points = routing.calculatePoints(source, target);
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThanOrEqual(2);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[points.length - 1]).toEqual({ x: 100, y: 100 });

      const svgPath = routing.generateSvgPath(points);
      expect(svgPath).toBeDefined();
      expect(svgPath).toContain('M');

      const pointOnPath = routing.getPointOnPath(points, 0.5);
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
        const points = routing.calculatePoints(config.source, config.target);
        const svgPath = routing.generateSvgPath(points);
        const midPoint = routing.getPointOnPath(points, 0.5);

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
      expect(typeof routing.calculatePoints).toBe('function');
      expect(typeof routing.generateSvgPath).toBe('function');
      expect(typeof routing.getPointOnPath).toBe('function');
    });

    it('should have correct method signatures', () => {
      expect(routing.calculatePoints.length).toBe(2);
      expect(routing.generateSvgPath.length).toBe(1);
      expect(routing.getPointOnPath.length).toBe(2);
    });

    it('should return correct types from methods', () => {
      vi.restoreAllMocks();
      const routing = new OrthogonalRouting();

      const source = { x: 0, y: 0, side: 'left' as PortSide };
      const target = { x: 100, y: 100, side: 'right' as PortSide };

      const points = routing.calculatePoints(source, target);
      expect(Array.isArray(points)).toBe(true);

      const svgPath = routing.generateSvgPath(points);
      expect(typeof svgPath).toBe('string');

      const pointOnPath = routing.getPointOnPath(points, 0.5);
      expect(pointOnPath).toHaveProperty('x');
      expect(pointOnPath).toHaveProperty('y');
      expect(typeof pointOnPath.x).toBe('number');
      expect(typeof pointOnPath.y).toBe('number');
    });
  });
});
