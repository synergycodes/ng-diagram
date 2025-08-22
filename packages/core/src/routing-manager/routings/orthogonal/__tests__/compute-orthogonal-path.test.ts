import { describe, expect, it } from 'vitest';
import { computeOrthogonalPath } from '../compute-orthogonal-path';

describe('computeOrthogonalPath', () => {
  describe('edge cases', () => {
    it('should return empty string for empty array', () => {
      const result = computeOrthogonalPath([]);
      expect(result).toBe('');
    });

    it('should return move command for single point', () => {
      const result = computeOrthogonalPath([{ x: 10, y: 20 }]);
      expect(result).toBe('M 10,20');
    });

    it('should return straight line for two points', () => {
      const result = computeOrthogonalPath([
        { x: 10, y: 20 },
        { x: 50, y: 60 },
      ]);
      expect(result).toBe('M 10,20 L 50,60');
    });
  });

  describe('orthogonal paths with corners', () => {
    it('should create path with rounded corner for L-shaped path (top-right)', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 0, y: 50 },
        { x: 50, y: 50 },
      ];
      const result = computeOrthogonalPath(points);
      // Should have M (move), L (line), A (arc), L (final line)
      expect(result).toContain('M 0,0');
      expect(result).toContain('A16,16'); // Arc with radius 16
      expect(result).toContain('L 50,50');
    });

    it('should create path with rounded corner for L-shaped path (right-bottom)', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
      ];
      const result = computeOrthogonalPath(points);
      expect(result).toContain('M 0,0');
      expect(result).toContain('A16,16');
      expect(result).toContain('L 50,50');
    });

    it('should create path with multiple corners (Z-shaped)', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 50 },
        { x: 100, y: 100 },
      ];
      const result = computeOrthogonalPath(points);
      expect(result).toContain('M 0,0');
      // Should have 3 arcs for 3 middle points
      expect((result.match(/A16,16/g) || []).length).toBe(3);
      expect(result).toContain('L 100,100');
    });

    it('should handle specific arc rotation case', () => {
      const points = [
        { x: 0, y: 50 },
        { x: 50, y: 50 },
        { x: 50, y: 0 },
      ];
      const result = computeOrthogonalPath(points);
      // This specific configuration produces counter-clockwise
      expect(result).toMatch(/A16,16,0,0,0,/);
    });

    it('should handle another arc rotation case', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
      ];
      const result = computeOrthogonalPath(points);
      // This specific configuration produces clockwise
      expect(result).toMatch(/A16,16,0,0,1,/);
    });
  });

  describe('straight line scenarios', () => {
    it('should handle vertical straight line with 3+ points', () => {
      const points = [
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 50, y: 100 },
      ];
      const result = computeOrthogonalPath(points);
      // Vertical straight line, middle point is passed through
      expect(result).toBe('M 50,0 L50,50 L 50,100');
    });

    it('should handle horizontal straight line with 3+ points', () => {
      const points = [
        { x: 0, y: 50 },
        { x: 50, y: 50 },
        { x: 100, y: 50 },
      ];
      const result = computeOrthogonalPath(points);
      // Horizontal straight line, middle point is passed through
      expect(result).toBe('M 0,50 L50,50 L 100,50');
    });
  });

  describe('dynamic radius calculation', () => {
    it('should use smaller radius when points are close', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 0, y: 20 }, // Only 20px apart
        { x: 20, y: 20 },
      ];
      const result = computeOrthogonalPath(points);
      // Radius should be min(20/2, 20/2, 16) = 10
      expect(result).toContain('A10,10');
    });

    it('should cap radius at provided maxRadius parameter', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 0, y: 100 }, // 100px apart
        { x: 100, y: 100 },
      ];
      const customMaxRadius = 20;
      const result = computeOrthogonalPath(points, customMaxRadius);
      // Radius should be min(100/2, 100/2, 20) = 20
      expect(result).toContain('A20,20');
    });
  });

  describe('close points handling', () => {
    it('should skip rendering when points are too close (≤1px) with only 2 middle points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 0.5, y: 0 }, // Very close horizontally
        { x: 0.5, y: 0.5 }, // Very close
        { x: 100, y: 100 },
      ];
      const result = computeOrthogonalPath(points);
      // Should have empty segments for skipped points
      expect(result).toContain('M 0,0');
      expect(result).toContain('L 100,100');
      // The skipped segments produce empty strings which result in extra spaces
      expect(result.includes('  ')).toBe(true);
    });

    it('should still render when points are close but more than 2 middle points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 0.5, y: 0 },
        { x: 0.5, y: 50 },
        { x: 50, y: 50 },
        { x: 100, y: 100 },
      ];
      const result = computeOrthogonalPath(points);
      // Should not skip since there are 3 middle points
      expect(result).not.toBe('M 0,0  L 100,100');
      expect(result.length).toBeGreaterThan('M 0,0  L 100,100'.length);
    });
  });

  describe('complex paths', () => {
    it('should handle rectangular path', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 50 },
        { x: 0, y: 50 },
        { x: 0, y: 100 },
      ];
      const result = computeOrthogonalPath(points);
      expect(result).toContain('M 0,0');
      expect(result).toContain('L 0,100');
      // Should have 3 arcs (one for each middle point)
      expect((result.match(/A16,16/g) || []).length).toBe(3);
    });

    it('should handle staircase pattern', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 20 },
        { x: 40, y: 20 },
        { x: 40, y: 40 },
        { x: 60, y: 40 },
      ];
      const result = computeOrthogonalPath(points);
      expect(result).toContain('M 0,0');
      expect(result).toContain('L 60,40');
      // Should have 4 arcs (one for each middle point)
      expect((result.match(/A10,10/g) || []).length).toBe(4);
    });
  });

  describe('arc direction determination', () => {
    it('should determine arc direction based on turn geometry', () => {
      // Test a few cases to ensure arcs are generated
      const points1 = [
        { x: 0, y: 0 },
        { x: 0, y: 50 },
        { x: 50, y: 50 },
      ];
      const result1 = computeOrthogonalPath(points1);
      expect(result1).toMatch(/A\d+,\d+,0,0,\d,/); // Has arc with direction

      const points2 = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
      ];
      const result2 = computeOrthogonalPath(points2);
      expect(result2).toMatch(/A\d+,\d+,0,0,\d,/); // Has arc with direction
    });

    it('should generate valid SVG arc commands', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ];
      const result = computeOrthogonalPath(points);
      // Check that arc commands have proper format: A rx,ry,x-axis-rotation,large-arc-flag,sweep-flag,x,y
      const arcPattern = /A(\d+),(\d+),0,0,[01],(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g;
      const arcs = result.match(arcPattern);
      expect(arcs).toBeTruthy();
      expect(arcs!.length).toBeGreaterThan(0);
    });
  });
});
