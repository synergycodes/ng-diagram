import { describe, expect, it } from 'vitest';
import { calculateDistanceFromEdge } from './calculate-distance-from-edge';

describe('calculateDistanceFromEdge', () => {
  const containerBox = { x: 100, y: 50, width: 400, height: 300 };

  it('should return Infinity when edge is null', () => {
    const clientPosition = { x: 200, y: 150 };
    const result = calculateDistanceFromEdge(containerBox, clientPosition, null);

    expect(result).toBe(Infinity);
  });

  it('should calculate distance from left edge correctly', () => {
    const clientPosition = { x: 120, y: 200 }; // 20px from left edge
    const result = calculateDistanceFromEdge(containerBox, clientPosition, 'left');

    expect(result).toBe(20);
  });

  it('should calculate distance from right edge correctly', () => {
    const clientPosition = { x: 480, y: 200 }; // 20px from right edge (500 - 480 = 20)
    const result = calculateDistanceFromEdge(containerBox, clientPosition, 'right');

    expect(result).toBe(20);
  });

  it('should calculate distance from top edge correctly', () => {
    const clientPosition = { x: 300, y: 70 }; // 20px from top edge
    const result = calculateDistanceFromEdge(containerBox, clientPosition, 'top');

    expect(result).toBe(20);
  });

  it('should calculate distance from bottom edge correctly', () => {
    const clientPosition = { x: 300, y: 330 }; // 20px from bottom edge (350 - 330 = 20)
    const result = calculateDistanceFromEdge(containerBox, clientPosition, 'bottom');

    expect(result).toBe(20);
  });

  it('should calculate Manhattan distance for topleft corner', () => {
    const clientPosition = { x: 110, y: 60 }; // 10px from left, 10px from top
    const result = calculateDistanceFromEdge(containerBox, clientPosition, 'topleft');

    expect(result).toBe(20); // 10 + 10
  });

  it('should calculate Manhattan distance for topright corner', () => {
    const clientPosition = { x: 490, y: 60 }; // 10px from right, 10px from top
    const result = calculateDistanceFromEdge(containerBox, clientPosition, 'topright');

    expect(result).toBe(20); // 10 + 10
  });

  it('should calculate Manhattan distance for bottomleft corner', () => {
    const clientPosition = { x: 110, y: 340 }; // 10px from left, 10px from bottom
    const result = calculateDistanceFromEdge(containerBox, clientPosition, 'bottomleft');

    expect(result).toBe(20); // 10 + 10
  });

  it('should calculate Manhattan distance for bottomright corner', () => {
    const clientPosition = { x: 490, y: 340 }; // 10px from right, 10px from bottom
    const result = calculateDistanceFromEdge(containerBox, clientPosition, 'bottomright');

    expect(result).toBe(20); // 10 + 10
  });

  it('should return 0 when exactly at the edge', () => {
    // At left edge
    const leftEdge = { x: 100, y: 200 };
    expect(calculateDistanceFromEdge(containerBox, leftEdge, 'left')).toBe(0);

    // At right edge
    const rightEdge = { x: 500, y: 200 };
    expect(calculateDistanceFromEdge(containerBox, rightEdge, 'right')).toBe(0);

    // At top edge
    const topEdge = { x: 300, y: 50 };
    expect(calculateDistanceFromEdge(containerBox, topEdge, 'top')).toBe(0);

    // At bottom edge
    const bottomEdge = { x: 300, y: 350 };
    expect(calculateDistanceFromEdge(containerBox, bottomEdge, 'bottom')).toBe(0);
  });

  it('should return Infinity for unknown edge', () => {
    const clientPosition = { x: 200, y: 150 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = calculateDistanceFromEdge(containerBox, clientPosition, 'unknown' as any);

    expect(result).toBe(Infinity);
  });
});
