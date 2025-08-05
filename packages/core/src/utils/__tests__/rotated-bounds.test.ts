import { describe, expect, it } from 'vitest';
import { mockNode } from '../../test-utils';
import type { Node } from '../../types';
import { getRotatedNodeBounds } from '../rotated-bounds';

describe('rotated-bounds', () => {
  describe('getRotatedNodeBounds', () => {
    it('should return regular bounds for non-rotated node', () => {
      const node: Node = {
        ...mockNode,
        position: { x: 100, y: 100 },
        size: { width: 50, height: 30 },
        angle: 0,
      };

      const bounds = getRotatedNodeBounds(node);

      expect(bounds).toEqual({
        minX: 100,
        minY: 100,
        maxX: 150,
        maxY: 130,
      });
    });

    it('should return regular bounds for node without angle property', () => {
      const node: Node = {
        ...mockNode,
        position: { x: 100, y: 100 },
        size: { width: 50, height: 30 },
      };

      const bounds = getRotatedNodeBounds(node);

      expect(bounds).toEqual({
        minX: 100,
        minY: 100,
        maxX: 150,
        maxY: 130,
      });
    });

    it('should calculate bounds for 90-degree rotation around center', () => {
      const node: Node = {
        ...mockNode,
        position: { x: 100, y: 100 },
        size: { width: 40, height: 20 },
        angle: 90,
      };

      const bounds = getRotatedNodeBounds(node);

      // After 90-degree rotation, width and height are swapped
      expect(bounds.minX).toBeCloseTo(110); // 100 + (40-20)/2
      expect(bounds.minY).toBeCloseTo(90); // 100 - (40-20)/2
      expect(bounds.maxX).toBeCloseTo(130); // 100 + 40 - (40-20)/2
      expect(bounds.maxY).toBeCloseTo(130); // 100 + 20 + (40-20)/2
    });

    it('should calculate bounds for 45-degree rotation around center', () => {
      const node: Node = {
        ...mockNode,
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        angle: 45,
      };

      const bounds = getRotatedNodeBounds(node);

      // For a square rotated 45 degrees, the diagonal becomes the width/height
      const expectedSize = Math.sqrt(2) * 100;
      const expectedOffset = (expectedSize - 100) / 2;

      expect(bounds.minX).toBeCloseTo(-expectedOffset);
      expect(bounds.minY).toBeCloseTo(-expectedOffset);
      expect(bounds.maxX).toBeCloseTo(100 + expectedOffset);
      expect(bounds.maxY).toBeCloseTo(100 + expectedOffset);
    });

    it('should use custom rotation center with normalized values', () => {
      const node: Node = {
        ...mockNode,
        position: { x: 100, y: 100 },
        size: { width: 40, height: 20 },
        angle: 90,
        rotationCenter: { x: 0, y: 0 }, // Top-left corner
      };

      const bounds = getRotatedNodeBounds(node);

      // Rotating around top-left corner (0,0)
      // When rotated 90 degrees, the rectangle pivots around top-left
      expect(bounds.minX).toBeCloseTo(80); // 100 - 20 (height becomes horizontal)
      expect(bounds.minY).toBeCloseTo(100); // Top stays at 100
      expect(bounds.maxX).toBeCloseTo(100); // Left edge stays at 100
      expect(bounds.maxY).toBeCloseTo(140); // 100 + 40 (width becomes vertical)
    });

    it('should handle rotation around bottom-right corner', () => {
      const node: Node = {
        ...mockNode,
        position: { x: 100, y: 100 },
        size: { width: 40, height: 20 },
        angle: 90,
        rotationCenter: { x: 1, y: 1 }, // Bottom-right corner
      };

      const bounds = getRotatedNodeBounds(node);

      // Rotating around bottom-right corner (1,1)
      // When rotated 90 degrees, the rectangle pivots around bottom-right
      expect(bounds.minX).toBeCloseTo(140); // Right edge stays at 140
      expect(bounds.minY).toBeCloseTo(80); // 120 - 40 (width becomes vertical height)
      expect(bounds.maxX).toBeCloseTo(160); // 140 + 20 (height becomes horizontal width)
      expect(bounds.maxY).toBeCloseTo(120); // Bottom stays at 120
    });

    it('should handle rotation around custom center point', () => {
      const node: Node = {
        ...mockNode,
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        angle: 180,
        rotationCenter: { x: 0.25, y: 0.5 }, // 25% from left, 50% from top
      };

      const bounds = getRotatedNodeBounds(node);

      // 180-degree rotation should flip the rectangle
      expect(bounds.minX).toBeCloseTo(-50); // Flipped around x=25
      expect(bounds.minY).toBeCloseTo(0);
      expect(bounds.maxX).toBeCloseTo(50);
      expect(bounds.maxY).toBeCloseTo(50);
    });

    it('should handle nodes without size', () => {
      const node: Node = {
        ...mockNode,
        position: { x: 100, y: 100 },
        angle: 45,
      };

      const bounds = getRotatedNodeBounds(node);

      expect(bounds).toEqual({
        minX: 100,
        minY: 100,
        maxX: 100,
        maxY: 100,
      });
    });

    it('should handle 360-degree rotation (full circle)', () => {
      const node: Node = {
        ...mockNode,
        position: { x: 100, y: 100 },
        size: { width: 50, height: 30 },
        angle: 360,
      };

      const bounds = getRotatedNodeBounds(node);

      // 360 degrees should be same as 0 degrees
      expect(bounds).toEqual({
        minX: 100,
        minY: 100,
        maxX: 150,
        maxY: 130,
      });
    });

    it('should handle negative angles', () => {
      const node1: Node = {
        ...mockNode,
        position: { x: 100, y: 100 },
        size: { width: 40, height: 20 },
        angle: -90,
      };

      const node2: Node = {
        ...mockNode,
        position: { x: 100, y: 100 },
        size: { width: 40, height: 20 },
        angle: 270,
      };

      const bounds1 = getRotatedNodeBounds(node1);
      const bounds2 = getRotatedNodeBounds(node2);

      // -90 degrees should be same as 270 degrees
      expect(bounds1.minX).toBeCloseTo(bounds2.minX);
      expect(bounds1.minY).toBeCloseTo(bounds2.minY);
      expect(bounds1.maxX).toBeCloseTo(bounds2.maxX);
      expect(bounds1.maxY).toBeCloseTo(bounds2.maxY);
    });

    it('should handle very small angles', () => {
      const node: Node = {
        ...mockNode,
        position: { x: 100, y: 100 },
        size: { width: 50, height: 30 },
        angle: 0.5, // Very small rotation
      };

      const bounds = getRotatedNodeBounds(node);

      // Should be very close to non-rotated bounds
      expect(bounds.minX).toBeCloseTo(100, 0);
      expect(bounds.minY).toBeCloseTo(100, 0);
      expect(bounds.maxX).toBeCloseTo(150, 0);
      expect(bounds.maxY).toBeCloseTo(130, 0);
    });
  });
});
