import { describe, expect, it } from 'vitest';
import { checkCollision, type RectWithAngle } from './collision-detection';
import type { Node } from '../types';

describe('checkCollision', () => {
  describe('non-rotated rectangles (axis-aligned)', () => {
    it('should detect collision when rectangles fully overlap', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 100 };
      const rectB: RectWithAngle = { x: 0, y: 0, width: 100, height: 100 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should detect collision when rectangles partially overlap', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 100 };
      const rectB: RectWithAngle = { x: 50, y: 50, width: 100, height: 100 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should detect collision when one rectangle is inside another', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 200, height: 200 };
      const rectB: RectWithAngle = { x: 50, y: 50, width: 50, height: 50 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should not detect collision when rectangles are separated horizontally', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 100 };
      const rectB: RectWithAngle = { x: 200, y: 0, width: 100, height: 100 };

      expect(checkCollision(rectA, rectB)).toBe(false);
    });

    it('should not detect collision when rectangles are separated vertically', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 100 };
      const rectB: RectWithAngle = { x: 0, y: 200, width: 100, height: 100 };

      expect(checkCollision(rectA, rectB)).toBe(false);
    });

    it('should not detect collision when rectangles are separated diagonally', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 100 };
      const rectB: RectWithAngle = { x: 200, y: 200, width: 100, height: 100 };

      expect(checkCollision(rectA, rectB)).toBe(false);
    });

    it('should detect collision when rectangles touch edges', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 100 };
      const rectB: RectWithAngle = { x: 100, y: 0, width: 100, height: 100 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should detect collision when rectangles touch corners', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 100 };
      const rectB: RectWithAngle = { x: 100, y: 100, width: 100, height: 100 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });
  });

  describe('rotated rectangles', () => {
    it('should detect collision between rotated rectangles that overlap', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 100, angle: 45 };
      const rectB: RectWithAngle = { x: 50, y: 50, width: 100, height: 100, angle: 0 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should not detect collision when rotated rectangles are separated', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 100, angle: 45 };
      const rectB: RectWithAngle = { x: 200, y: 200, width: 100, height: 100, angle: 45 };

      expect(checkCollision(rectA, rectB)).toBe(false);
    });

    it('should detect collision when one rectangle is rotated 90 degrees', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 50, angle: 0 };
      const rectB: RectWithAngle = { x: 25, y: -25, width: 50, height: 100, angle: 0 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should handle 180 degree rotation correctly', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 100, angle: 0 };
      const rectB: RectWithAngle = { x: 0, y: 0, width: 100, height: 100, angle: 180 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should handle 360 degree rotation as same as 0 degrees', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 100, angle: 0 };
      const rectB: RectWithAngle = { x: 50, y: 50, width: 100, height: 100, angle: 360 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should detect collision with negative angles', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 100, angle: -45 };
      const rectB: RectWithAngle = { x: 50, y: 50, width: 100, height: 100, angle: 0 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should handle small rotation angles', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 100, angle: 1 };
      const rectB: RectWithAngle = { x: 50, y: 50, width: 100, height: 100, angle: 0 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should not detect collision when rotated rectangles just miss each other', () => {
      // Two squares rotated 45 degrees, positioned so they don't touch
      const rectA: RectWithAngle = { x: 0, y: 0, width: 50, height: 50, angle: 45 };
      const rectB: RectWithAngle = { x: 100, y: 0, width: 50, height: 50, angle: 45 };

      expect(checkCollision(rectA, rectB)).toBe(false);
    });
  });

  describe('Node objects', () => {
    it('should detect collision between two nodes', () => {
      const nodeA: Node = {
        id: 'a',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        data: {},
      };
      const nodeB: Node = {
        id: 'b',
        position: { x: 50, y: 50 },
        size: { width: 100, height: 100 },
        data: {},
      };

      expect(checkCollision(nodeA, nodeB)).toBe(true);
    });

    it('should not detect collision when nodes are separated', () => {
      const nodeA: Node = {
        id: 'a',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        data: {},
      };
      const nodeB: Node = {
        id: 'b',
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
        data: {},
      };

      expect(checkCollision(nodeA, nodeB)).toBe(false);
    });

    it('should detect collision between rotated nodes', () => {
      const nodeA: Node = {
        id: 'a',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        angle: 45,
        data: {},
      };
      const nodeB: Node = {
        id: 'b',
        position: { x: 50, y: 50 },
        size: { width: 100, height: 100 },
        angle: 0,
        data: {},
      };

      expect(checkCollision(nodeA, nodeB)).toBe(true);
    });

    it('should return false when first node has no size', () => {
      const nodeA: Node = {
        id: 'a',
        position: { x: 0, y: 0 },
        data: {},
      };
      const nodeB: Node = {
        id: 'b',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        data: {},
      };

      expect(checkCollision(nodeA, nodeB)).toBe(false);
    });

    it('should return false when second node has no size', () => {
      const nodeA: Node = {
        id: 'a',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        data: {},
      };
      const nodeB: Node = {
        id: 'b',
        position: { x: 0, y: 0 },
        data: {},
      };

      expect(checkCollision(nodeA, nodeB)).toBe(false);
    });

    it('should return false when both nodes have no size', () => {
      const nodeA: Node = {
        id: 'a',
        position: { x: 0, y: 0 },
        data: {},
      };
      const nodeB: Node = {
        id: 'b',
        position: { x: 0, y: 0 },
        data: {},
      };

      expect(checkCollision(nodeA, nodeB)).toBe(false);
    });

    it('should use size property for collision detection', () => {
      // Note: checkCollision uses size, not measuredBounds
      const nodeA: Node = {
        id: 'a',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        measuredBounds: { x: 0, y: 0, width: 200, height: 200 },
        data: {},
      };
      const nodeB: Node = {
        id: 'b',
        position: { x: 90, y: 0 },
        size: { width: 100, height: 100 },
        data: {},
      };

      expect(checkCollision(nodeA, nodeB)).toBe(true);
    });
  });

  describe('mixed Node and RectWithAngle', () => {
    it('should detect collision between Node and RectWithAngle', () => {
      const node: Node = {
        id: 'a',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        data: {},
      };
      const rect: RectWithAngle = { x: 50, y: 50, width: 100, height: 100 };

      expect(checkCollision(node, rect)).toBe(true);
    });

    it('should not detect collision when Node and RectWithAngle are separated', () => {
      const node: Node = {
        id: 'a',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        data: {},
      };
      const rect: RectWithAngle = { x: 200, y: 0, width: 100, height: 100 };

      expect(checkCollision(node, rect)).toBe(false);
    });

    it('should detect collision between rotated Node and RectWithAngle', () => {
      const node: Node = {
        id: 'a',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        angle: 45,
        data: {},
      };
      const rect: RectWithAngle = { x: 50, y: 50, width: 100, height: 100, angle: 0 };

      expect(checkCollision(node, rect)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle zero-width rectangles', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 0, height: 100 };
      const rectB: RectWithAngle = { x: 0, y: 0, width: 100, height: 100 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should handle zero-height rectangles', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 0 };
      const rectB: RectWithAngle = { x: 0, y: 0, width: 100, height: 100 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should handle zero-sized rectangles', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 0, height: 0 };
      const rectB: RectWithAngle = { x: 0, y: 0, width: 100, height: 100 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should handle very small rectangles', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 1, height: 1 };
      const rectB: RectWithAngle = { x: 0.5, y: 0.5, width: 1, height: 1 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should handle very large rectangles', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 10000, height: 10000 };
      const rectB: RectWithAngle = { x: 5000, y: 5000, width: 10000, height: 10000 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should handle negative coordinates', () => {
      const rectA: RectWithAngle = { x: -100, y: -100, width: 100, height: 100 };
      const rectB: RectWithAngle = { x: -50, y: -50, width: 100, height: 100 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should handle rectangles with decimal positions', () => {
      const rectA: RectWithAngle = { x: 0.5, y: 0.5, width: 100, height: 100 };
      const rectB: RectWithAngle = { x: 50.7, y: 50.3, width: 100, height: 100 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should handle undefined angle as 0 degrees', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 100 };
      const rectB: RectWithAngle = { x: 50, y: 50, width: 100, height: 100, angle: undefined };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });
  });

  describe('complex rotation scenarios', () => {
    it('should detect collision with overlapping rotated rectangles', () => {
      // Two overlapping rectangles with different rotations
      const rectA: RectWithAngle = { x: 50, y: 50, width: 100, height: 100, angle: 30 };
      const rectB: RectWithAngle = { x: 75, y: 75, width: 100, height: 100, angle: 60 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should not detect collision when rotated rectangles are positioned near but not touching', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 20, angle: 30 };
      const rectB: RectWithAngle = { x: 150, y: 0, width: 100, height: 20, angle: -30 };

      expect(checkCollision(rectA, rectB)).toBe(false);
    });

    it('should handle both rectangles rotated at same angle', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 100, angle: 45 };
      const rectB: RectWithAngle = { x: 50, y: 50, width: 100, height: 100, angle: 45 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });

    it('should handle both rectangles rotated at different angles', () => {
      const rectA: RectWithAngle = { x: 0, y: 0, width: 100, height: 100, angle: 30 };
      const rectB: RectWithAngle = { x: 50, y: 50, width: 100, height: 100, angle: 60 };

      expect(checkCollision(rectA, rectB)).toBe(true);
    });
  });

  describe('realistic diagram scenarios', () => {
    it('should detect collision between adjacent diagram nodes', () => {
      const nodeA: Node = {
        id: 'node-1',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 },
        data: {},
      };
      const nodeB: Node = {
        id: 'node-2',
        position: { x: 250, y: 100 },
        size: { width: 200, height: 100 },
        data: {},
      };

      expect(checkCollision(nodeA, nodeB)).toBe(true);
    });

    it('should not detect collision between well-separated diagram nodes', () => {
      const nodeA: Node = {
        id: 'node-1',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 },
        data: {},
      };
      const nodeB: Node = {
        id: 'node-2',
        position: { x: 400, y: 300 },
        size: { width: 200, height: 100 },
        data: {},
      };

      expect(checkCollision(nodeA, nodeB)).toBe(false);
    });

    it('should detect collision when dropping a node onto another', () => {
      const existingNode: Node = {
        id: 'existing',
        position: { x: 200, y: 200 },
        size: { width: 150, height: 80 },
        data: {},
      };
      const droppedNode: Node = {
        id: 'dropped',
        position: { x: 220, y: 220 },
        size: { width: 100, height: 60 },
        data: {},
      };

      expect(checkCollision(existingNode, droppedNode)).toBe(true);
    });

    it('should handle rotated nodes in a diagram', () => {
      const nodeA: Node = {
        id: 'rotated-node',
        position: { x: 100, y: 100 },
        size: { width: 150, height: 50 },
        angle: 30,
        data: {},
      };
      const nodeB: Node = {
        id: 'normal-node',
        position: { x: 150, y: 120 },
        size: { width: 100, height: 80 },
        data: {},
      };

      expect(checkCollision(nodeA, nodeB)).toBe(true);
    });
  });
});
