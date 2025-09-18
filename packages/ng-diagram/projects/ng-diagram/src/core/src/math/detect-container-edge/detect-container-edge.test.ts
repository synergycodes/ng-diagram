import { describe, expect, it } from 'vitest';
import { Rect } from '../../types';
import { detectContainerEdge } from './detect-container-edge';

describe('detectContainerEdge', () => {
  const containerBox: Rect = {
    x: 100,
    y: 50,
    width: 200,
    height: 150,
  };
  const detectionThreshold = 10;

  describe('corner detection', () => {
    it('should detect topleft corner when within threshold', () => {
      const result = detectContainerEdge(containerBox, { x: 105, y: 55 }, detectionThreshold);
      expect(result).toBe('topleft');
    });

    it('should detect bottomleft corner when within threshold', () => {
      const result = detectContainerEdge(containerBox, { x: 105, y: 195 }, detectionThreshold);
      expect(result).toBe('bottomleft');
    });

    it('should detect topright corner when within threshold', () => {
      const result = detectContainerEdge(containerBox, { x: 295, y: 55 }, detectionThreshold);
      expect(result).toBe('topright');
    });

    it('should detect bottomright corner when within threshold', () => {
      const result = detectContainerEdge(containerBox, { x: 295, y: 195 }, detectionThreshold);
      expect(result).toBe('bottomright');
    });
  });

  describe('edge detection', () => {
    it('should detect left edge when not in corner area', () => {
      const result = detectContainerEdge(containerBox, { x: 105, y: 100 }, detectionThreshold);
      expect(result).toBe('left');
    });

    it('should detect right edge when not in corner area', () => {
      const result = detectContainerEdge(containerBox, { x: 295, y: 100 }, detectionThreshold);
      expect(result).toBe('right');
    });

    it('should detect top edge when not in corner area', () => {
      const result = detectContainerEdge(containerBox, { x: 200, y: 55 }, detectionThreshold);
      expect(result).toBe('top');
    });

    it('should detect bottom edge when not in corner area', () => {
      const result = detectContainerEdge(containerBox, { x: 200, y: 195 }, detectionThreshold);
      expect(result).toBe('bottom');
    });
  });

  describe('center and null detection', () => {
    it('should return null when in center of container', () => {
      const result = detectContainerEdge(containerBox, { x: 200, y: 125 }, detectionThreshold);
      expect(result).toBe(null);
    });

    it('should return null when inside but not near edges', () => {
      const result = detectContainerEdge(containerBox, { x: 150, y: 100 }, detectionThreshold);
      expect(result).toBe(null);
    });

    it('should return null when inside but not near edges (different position)', () => {
      const result = detectContainerEdge(containerBox, { x: 250, y: 150 }, detectionThreshold);
      expect(result).toBe(null);
    });
  });

  describe('exact boundary tests', () => {
    it('should detect topleft when exactly at threshold boundary', () => {
      const result = detectContainerEdge(containerBox, { x: 109, y: 59 }, detectionThreshold);
      expect(result).toBe('topleft');
    });

    it('should return null when at threshold boundary (not less than)', () => {
      const result = detectContainerEdge(containerBox, { x: 110, y: 60 }, detectionThreshold);
      expect(result).toBe(null);
    });

    it('should detect topright when exactly at threshold boundary', () => {
      const result = detectContainerEdge(containerBox, { x: 291, y: 59 }, detectionThreshold);
      expect(result).toBe('topright');
    });

    it('should return null when just outside right threshold boundary', () => {
      const result = detectContainerEdge(containerBox, { x: 290, y: 60 }, detectionThreshold);
      expect(result).toBe(null);
    });
  });

  describe('exact corner and edge positions', () => {
    it('should detect topleft at exact corner position', () => {
      const result = detectContainerEdge(containerBox, { x: 100, y: 50 }, detectionThreshold);
      expect(result).toBe('topleft');
    });

    it('should detect bottomright at exact corner position', () => {
      const result = detectContainerEdge(containerBox, { x: 300, y: 200 }, detectionThreshold);
      expect(result).toBe('bottomright');
    });

    it('should detect left edge at exact left boundary', () => {
      const result = detectContainerEdge(containerBox, { x: 100, y: 125 }, detectionThreshold);
      expect(result).toBe('left');
    });

    it('should detect right edge at exact right boundary', () => {
      const result = detectContainerEdge(containerBox, { x: 300, y: 125 }, detectionThreshold);
      expect(result).toBe('right');
    });

    it('should detect top edge at exact top boundary', () => {
      const result = detectContainerEdge(containerBox, { x: 200, y: 50 }, detectionThreshold);
      expect(result).toBe('top');
    });

    it('should detect bottom edge at exact bottom boundary', () => {
      const result = detectContainerEdge(containerBox, { x: 200, y: 200 }, detectionThreshold);
      expect(result).toBe('bottom');
    });
  });

  describe('edge cases', () => {
    it('should handle zero threshold', () => {
      const result = detectContainerEdge(containerBox, { x: 200, y: 125 }, 0);
      expect(result).toBe(null);
    });

    it('should handle large threshold that covers entire container', () => {
      const result = detectContainerEdge(containerBox, { x: 200, y: 125 }, 1000);
      expect(result).toBe('topleft');
    });

    it('should handle negative coordinates in container', () => {
      const negativeContainer: Rect = {
        x: -100,
        y: -50,
        width: 200,
        height: 150,
      };
      const result = detectContainerEdge(negativeContainer, { x: -95, y: -45 }, 10);
      expect(result).toBe('topleft');
    });

    it('should handle decimal coordinates', () => {
      const decimalContainer: Rect = {
        x: 10.5,
        y: 20.7,
        width: 100.2,
        height: 80.6,
      };
      const result = detectContainerEdge(decimalContainer, { x: 15.3, y: 25.1 }, 8.5);
      expect(result).toBe('topleft');
    });

    it('should handle very small container', () => {
      const smallContainer: Rect = {
        x: 0,
        y: 0,
        width: 5,
        height: 5,
      };
      const result = detectContainerEdge(smallContainer, { x: 2.5, y: 2.5 }, 10);
      expect(result).toBe('topleft');
    });
  });

  describe('priority order verification', () => {
    it('should prioritize corner detection over edge detection', () => {
      const result = detectContainerEdge(containerBox, { x: 105, y: 55 }, detectionThreshold);
      expect(result).toBe('topleft');
    });

    it.each`
      pos                   | expected
      ${{ x: 105, y: 55 }}  | ${'topleft'}
      ${{ x: 295, y: 55 }}  | ${'topright'}
      ${{ x: 105, y: 195 }} | ${'bottomleft'}
      ${{ x: 295, y: 195 }} | ${'bottomright'}
    `('should prioritize corner detection over edge detection for $expected corner', ({ pos, expected }) => {
      const result = detectContainerEdge(containerBox, pos, detectionThreshold);
      expect(result).toBe(expected);
    });
  });

  describe('threshold sensitivity', () => {
    const basePosition = { x: 104, y: 125 };

    it('should detect left edge with threshold of 10', () => {
      const result = detectContainerEdge(containerBox, basePosition, 10);
      expect(result).toBe('left');
    });

    it('should not detect edge with threshold of 4', () => {
      const result = detectContainerEdge(containerBox, basePosition, 4);
      expect(result).toBe(null);
    });

    it('should detect edge with threshold of 5', () => {
      const result = detectContainerEdge(containerBox, basePosition, 5);
      expect(result).toBe('left');
    });
  });
});
