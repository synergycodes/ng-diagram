import { describe, it, expect } from 'vitest';
import { calculateEdgePanningForce } from './calculate-edge-panning-force';
import { Point, Rect } from '../../types';

describe('calculateEdgePanningForce', () => {
  const containerBox: Rect = {
    x: 0,
    y: 0,
    width: 1000,
    height: 800,
  };

  const detectionThreshold = 50;
  const forceMultiplier = 1;

  describe('no panning force', () => {
    it('should return null when pointer is in the center of the container', () => {
      const clientPosition: Point = { x: 500, y: 400 };
      const result = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, forceMultiplier);

      expect(result).toBeNull();
    });

    it('should return null when pointer is just outside the detection threshold', () => {
      const clientPosition: Point = { x: 51, y: 400 };
      const result = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, forceMultiplier);

      expect(result).toBeNull();
    });

    it('should return null when pointer is at exactly the threshold distance', () => {
      const clientPosition: Point = { x: 50, y: 400 };
      const result = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, forceMultiplier);

      expect(result).toBeNull();
    });
  });

  describe('left edge panning', () => {
    it('should return positive x force when pointer is near left edge', () => {
      const clientPosition: Point = { x: 10, y: 400 };
      const result = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, forceMultiplier);

      expect(result).not.toBeNull();
      expect(result!.x).toBeGreaterThan(0);
      expect(result!.y).toBe(0);
    });

    it('should return stronger force when closer to left edge', () => {
      const position1: Point = { x: 40, y: 400 };
      const position2: Point = { x: 20, y: 400 };
      const position3: Point = { x: 5, y: 400 };

      const result1 = calculateEdgePanningForce(containerBox, position1, detectionThreshold, forceMultiplier);
      const result2 = calculateEdgePanningForce(containerBox, position2, detectionThreshold, forceMultiplier);
      const result3 = calculateEdgePanningForce(containerBox, position3, detectionThreshold, forceMultiplier);

      expect(result1!.x).toBeGreaterThan(0);
      expect(result2!.x).toBeGreaterThan(0);
      expect(result3!.x).toBeGreaterThan(0);

      // Due to logarithmic scaling, the relationship is not linear
      // but closer to edge should still have stronger absolute force
      expect(Math.abs(result3!.x)).toBeGreaterThan(Math.abs(result1!.x));
    });

    it('should apply force multiplier for left edge', () => {
      const clientPosition: Point = { x: 10, y: 400 };
      const result1 = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, 1);
      const result2 = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, 2);

      expect(Math.abs(result2!.x)).toBeCloseTo(Math.abs(result1!.x) * 2);
    });
  });

  describe('right edge panning', () => {
    it('should return negative x force when pointer is near right edge', () => {
      const clientPosition: Point = { x: 990, y: 400 };
      const result = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, forceMultiplier);

      expect(result).not.toBeNull();
      expect(result!.x).toBeLessThan(0);
      expect(result!.y).toBe(0);
    });

    it('should return stronger force when closer to right edge', () => {
      const position1: Point = { x: 960, y: 400 };
      const position2: Point = { x: 980, y: 400 };
      const position3: Point = { x: 995, y: 400 };

      const result1 = calculateEdgePanningForce(containerBox, position1, detectionThreshold, forceMultiplier);
      const result2 = calculateEdgePanningForce(containerBox, position2, detectionThreshold, forceMultiplier);
      const result3 = calculateEdgePanningForce(containerBox, position3, detectionThreshold, forceMultiplier);

      expect(result1!.x).toBeLessThan(0);
      expect(result2!.x).toBeLessThan(0);
      expect(result3!.x).toBeLessThan(0);

      expect(Math.abs(result3!.x)).toBeGreaterThan(Math.abs(result1!.x));
    });

    it('should apply force multiplier for right edge', () => {
      const clientPosition: Point = { x: 990, y: 400 };
      const result1 = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, 1);
      const result2 = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, 2);

      expect(Math.abs(result2!.x)).toBeCloseTo(Math.abs(result1!.x) * 2);
    });
  });

  describe('top edge panning', () => {
    it('should return positive y force when pointer is near top edge', () => {
      const clientPosition: Point = { x: 500, y: 10 };
      const result = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, forceMultiplier);

      expect(result).not.toBeNull();
      expect(result!.x).toBe(0);
      expect(result!.y).toBeGreaterThan(0);
    });

    it('should return stronger force when closer to top edge', () => {
      const position1: Point = { x: 500, y: 40 };
      const position2: Point = { x: 500, y: 20 };
      const position3: Point = { x: 500, y: 5 };

      const result1 = calculateEdgePanningForce(containerBox, position1, detectionThreshold, forceMultiplier);
      const result2 = calculateEdgePanningForce(containerBox, position2, detectionThreshold, forceMultiplier);
      const result3 = calculateEdgePanningForce(containerBox, position3, detectionThreshold, forceMultiplier);

      expect(result1!.y).toBeGreaterThan(0);
      expect(result2!.y).toBeGreaterThan(0);
      expect(result3!.y).toBeGreaterThan(0);

      expect(Math.abs(result3!.y)).toBeGreaterThan(Math.abs(result1!.y));
    });

    it('should apply force multiplier for top edge', () => {
      const clientPosition: Point = { x: 500, y: 10 };
      const result1 = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, 1);
      const result2 = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, 2);

      expect(Math.abs(result2!.y)).toBeCloseTo(Math.abs(result1!.y) * 2);
    });
  });

  describe('bottom edge panning', () => {
    it('should return negative y force when pointer is near bottom edge', () => {
      const clientPosition: Point = { x: 500, y: 790 };
      const result = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, forceMultiplier);

      expect(result).not.toBeNull();
      expect(result!.x).toBe(0);
      expect(result!.y).toBeLessThan(0);
    });

    it('should return stronger force when closer to bottom edge', () => {
      const position1: Point = { x: 500, y: 760 };
      const position2: Point = { x: 500, y: 780 };
      const position3: Point = { x: 500, y: 795 };

      const result1 = calculateEdgePanningForce(containerBox, position1, detectionThreshold, forceMultiplier);
      const result2 = calculateEdgePanningForce(containerBox, position2, detectionThreshold, forceMultiplier);
      const result3 = calculateEdgePanningForce(containerBox, position3, detectionThreshold, forceMultiplier);

      expect(result1!.y).toBeLessThan(0);
      expect(result2!.y).toBeLessThan(0);
      expect(result3!.y).toBeLessThan(0);

      expect(Math.abs(result3!.y)).toBeGreaterThan(Math.abs(result1!.y));
    });

    it('should apply force multiplier for bottom edge', () => {
      const clientPosition: Point = { x: 500, y: 790 };
      const result1 = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, 1);
      const result2 = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, 2);

      expect(Math.abs(result2!.y)).toBeCloseTo(Math.abs(result1!.y) * 2);
    });
  });

  describe('corner panning', () => {
    it('should return both x and y forces when pointer is in top-left corner', () => {
      const clientPosition: Point = { x: 10, y: 10 };
      const result = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, forceMultiplier);

      expect(result).not.toBeNull();
      expect(result!.x).toBeGreaterThan(0);
      expect(result!.y).toBeGreaterThan(0);
    });

    it('should return both x and y forces when pointer is in top-right corner', () => {
      const clientPosition: Point = { x: 990, y: 10 };
      const result = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, forceMultiplier);

      expect(result).not.toBeNull();
      expect(result!.x).toBeLessThan(0);
      expect(result!.y).toBeGreaterThan(0);
    });

    it('should return both x and y forces when pointer is in bottom-left corner', () => {
      const clientPosition: Point = { x: 10, y: 790 };
      const result = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, forceMultiplier);

      expect(result).not.toBeNull();
      expect(result!.x).toBeGreaterThan(0);
      expect(result!.y).toBeLessThan(0);
    });

    it('should return both x and y forces when pointer is in bottom-right corner', () => {
      const clientPosition: Point = { x: 990, y: 790 };
      const result = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, forceMultiplier);

      expect(result).not.toBeNull();
      expect(result!.x).toBeLessThan(0);
      expect(result!.y).toBeLessThan(0);
    });
  });

  describe('container with offset', () => {
    it('should calculate correctly when container has x/y offset', () => {
      const offsetContainer: Rect = {
        x: 100,
        y: 100,
        width: 1000,
        height: 800,
      };

      // Near left edge relative to offset container
      const clientPosition: Point = { x: 110, y: 400 };
      const result = calculateEdgePanningForce(offsetContainer, clientPosition, detectionThreshold, forceMultiplier);

      expect(result).not.toBeNull();
      expect(result!.x).toBeGreaterThan(0);
    });

    it('should handle negative container coordinates', () => {
      const negativeContainer: Rect = {
        x: -500,
        y: -400,
        width: 1000,
        height: 800,
      };

      // Near left edge
      const clientPosition: Point = { x: -490, y: 0 };
      const result = calculateEdgePanningForce(negativeContainer, clientPosition, detectionThreshold, forceMultiplier);

      expect(result).not.toBeNull();
      expect(result!.x).toBeGreaterThan(0);
    });
  });

  describe('different detection thresholds', () => {
    it('should trigger panning with larger detection threshold', () => {
      const clientPosition: Point = { x: 80, y: 400 };

      const result1 = calculateEdgePanningForce(containerBox, clientPosition, 50, forceMultiplier);
      const result2 = calculateEdgePanningForce(containerBox, clientPosition, 100, forceMultiplier);

      expect(result1).toBeNull();
      expect(result2).not.toBeNull();
      expect(result2!.x).toBeGreaterThan(0);
    });

    it('should work with very small detection threshold', () => {
      const clientPosition: Point = { x: 2, y: 400 };
      const result = calculateEdgePanningForce(containerBox, clientPosition, 5, forceMultiplier);

      expect(result).not.toBeNull();
      expect(result!.x).toBeGreaterThan(0);
    });

    it('should work with zero detection threshold', () => {
      const clientPosition: Point = { x: 0, y: 400 };
      const result = calculateEdgePanningForce(containerBox, clientPosition, 0, forceMultiplier);

      expect(result).toBeNull();
    });
  });

  describe('force calculation with logarithmic scaling', () => {
    it('should apply logarithmic scaling to force values', () => {
      const position1: Point = { x: 0, y: 400 }; // 50 units from edge
      const position2: Point = { x: 25, y: 400 }; // 25 units from edge

      const result1 = calculateEdgePanningForce(containerBox, position1, detectionThreshold, forceMultiplier);
      const result2 = calculateEdgePanningForce(containerBox, position2, detectionThreshold, forceMultiplier);

      // Raw delta is doubled, but with logarithmic scaling the force shouldn't double
      const rawDelta1 = 50;
      const rawDelta2 = 25;
      const ratio = Math.abs(result1!.x) / Math.abs(result2!.x);

      // Ratio should be less than the raw delta ratio due to logarithmic dampening
      expect(ratio).toBeLessThan(rawDelta1 / rawDelta2);
    });

    it('should scale force correctly with different multipliers', () => {
      const clientPosition: Point = { x: 10, y: 10 };

      const result1 = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, 1);
      const result2 = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, 5);
      const result3 = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, 0.5);

      expect(Math.abs(result2!.x)).toBeCloseTo(Math.abs(result1!.x) * 5);
      expect(Math.abs(result2!.y)).toBeCloseTo(Math.abs(result1!.y) * 5);

      expect(Math.abs(result3!.x)).toBeCloseTo(Math.abs(result1!.x) * 0.5);
      expect(Math.abs(result3!.y)).toBeCloseTo(Math.abs(result1!.y) * 0.5);
    });
  });

  describe('edge cases', () => {
    it('should handle pointer exactly at container edge', () => {
      const clientPosition: Point = { x: 0, y: 0 };
      const result = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, forceMultiplier);

      expect(result).not.toBeNull();
      expect(result!.x).toBeGreaterThan(0);
      expect(result!.y).toBeGreaterThan(0);
    });

    it('should handle pointer outside container bounds', () => {
      const clientPosition: Point = { x: -10, y: -10 };
      const result = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, forceMultiplier);

      expect(result).not.toBeNull();
      expect(result!.x).toBeGreaterThan(0);
      expect(result!.y).toBeGreaterThan(0);
    });

    it('should handle very small container', () => {
      const smallContainer: Rect = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };

      const clientPosition: Point = { x: 10, y: 10 };
      const result = calculateEdgePanningForce(smallContainer, clientPosition, detectionThreshold, forceMultiplier);

      // With threshold of 50, both edges could be in range
      expect(result).not.toBeNull();
    });

    it('should handle zero force multiplier', () => {
      const clientPosition: Point = { x: 10, y: 10 };
      const result = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, 0);

      expect(result).not.toBeNull();
      expect(result!.x).toBe(0);
      expect(result!.y).toBe(0);
    });

    it('should handle negative force multiplier', () => {
      const clientPosition: Point = { x: 10, y: 400 };
      const result = calculateEdgePanningForce(containerBox, clientPosition, detectionThreshold, -1);

      expect(result).not.toBeNull();
      // Negative multiplier should reverse the force direction
      expect(result!.x).toBeLessThan(0);
    });
  });
});
