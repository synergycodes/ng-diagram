import { describe, expect, it } from 'vitest';
import { Node } from '../../types';
import { getNodeBorderIntersection } from '../get-node-border-intersection';

describe('getNodeBorderIntersection', () => {
  const createNode = (x: number, y: number, width = 100, height = 50): Node => ({
    id: 'test-node',
    position: { x, y },
    size: { width, height },
    data: {},
  });

  describe('basic node', () => {
    it('should intersect right side when from point is to the right', () => {
      const node = createNode(0, 0, 100, 50);
      const from = { x: 200, y: 25 }; // Point to the right of the node center

      const result = getNodeBorderIntersection(node, from);

      expect(result.x).toBe(100); // Right edge
      expect(result.y).toBe(25); // Center Y
      expect(result.side).toBe('right');
    });

    it('should intersect left side when from point is to the left', () => {
      const node = createNode(100, 0, 100, 50);
      const from = { x: 0, y: 25 }; // Point to the left of the node center

      const result = getNodeBorderIntersection(node, from);

      expect(result.x).toBe(100); // Left edge
      expect(result.y).toBe(25); // Center Y
      expect(result.side).toBe('left');
    });

    it('should intersect top side when from point is above', () => {
      const node = createNode(0, 100, 100, 50);
      const from = { x: 50, y: 0 }; // Point above the node center

      const result = getNodeBorderIntersection(node, from);

      expect(result.x).toBe(50); // Center X
      expect(result.y).toBe(100); // Top edge
      expect(result.side).toBe('top');
    });

    it('should intersect bottom side when from point is below', () => {
      const node = createNode(0, 0, 100, 50);
      const from = { x: 50, y: 200 }; // Point below the node center

      const result = getNodeBorderIntersection(node, from);

      expect(result.x).toBe(50); // Center X
      expect(result.y).toBe(50); // Bottom edge
      expect(result.side).toBe('bottom');
    });
  });

  describe('diagonal directions', () => {
    it('should prioritize horizontal direction when angle is more horizontal', () => {
      const node = createNode(0, 0, 100, 50);
      const from = { x: 200, y: 50 }; // Diagonally down-right, but more to the right

      const result = getNodeBorderIntersection(node, from);

      // Should intersect right side because horizontal distance is greater
      expect(result.side).toBe('right');
      expect(result.x).toBe(100);
    });

    it('should prioritize vertical direction when angle is more vertical', () => {
      const node = createNode(0, 0, 100, 50);
      const from = { x: 60, y: 200 }; // Diagonally down-right, but more down

      const result = getNodeBorderIntersection(node, from);

      // Should intersect bottom side because vertical distance is greater
      expect(result.side).toBe('bottom');
      expect(result.y).toBe(50);
    });
  });

  describe('with rotated nodes', () => {
    it('should use position + size (not measuredBounds) even for rotated nodes', () => {
      const node: Node = {
        id: 'rotated-node',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        angle: 45,
        measuredBounds: {
          x: -10,
          y: -10,
          width: 120,
          height: 70,
        },
        data: {},
      };

      const from = { x: 200, y: 25 };

      const result = getNodeBorderIntersection(node, from);

      // Should use position + size, NOT measuredBounds
      // This ensures edges connect to the main node body, not the extended bounds from protruding ports
      expect(result.x).toBe(100); // position.x + size.width
      expect(result.y).toBe(25); // Center Y of the main node body
      expect(result.side).toBe('right');
    });
  });

  describe('edge cases', () => {
    it('should handle from point at exact node center', () => {
      const node = createNode(0, 0, 100, 50);
      const from = { x: 50, y: 25 }; // Exact center

      const result = getNodeBorderIntersection(node, from);

      // When dx and dy are both 0, angleToSide will still return a valid side
      // The actual side depends on how angleToSide handles 0 angle
      expect(result).toHaveProperty('side');
      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
    });

    it('should handle nodes with different aspect ratios', () => {
      const tallNode = createNode(0, 0, 50, 200); // Tall and narrow
      const from = { x: 100, y: 100 };

      const result = getNodeBorderIntersection(tallNode, from);

      // Should still calculate correct intersection
      expect(result).toHaveProperty('side');
      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
    });

    it('should handle very small nodes', () => {
      const smallNode = createNode(0, 0, 10, 10);
      const from = { x: 100, y: 5 };

      const result = getNodeBorderIntersection(smallNode, from);

      expect(result.side).toBe('right');
      expect(result.x).toBe(10);
      expect(result.y).toBe(5);
    });

    it('should handle from point where ray misses all edges in valid range', () => {
      const node = createNode(100, 100, 100, 50);
      // This is a scenario where the calculated t values might be valid but the intersection
      // points fall outside the edge boundaries, causing all intersections to be rejected
      // In practice, this is rare but the code should handle it gracefully
      const from = { x: 0, y: 0 }; // Far corner

      const result = getNodeBorderIntersection(node, from);

      // Should return a valid point (either intersection or fallback to center)
      expect(Number.isFinite(result.x)).toBe(true);
      expect(Number.isFinite(result.y)).toBe(true);
      expect(result.side).toBeDefined();
      // The actual values depend on the geometry, but they should be finite
    });
  });

  describe('realistic scenarios', () => {
    it('should calculate correct intersection for nodes in a horizontal flow', () => {
      // const sourceNode = createNode(0, 50, 100, 50);
      const targetNode = createNode(200, 50, 100, 50);

      // Calculate intersection on target node from source center
      const sourceCenter = { x: 50, y: 75 };
      const result = getNodeBorderIntersection(targetNode, sourceCenter);

      expect(result.side).toBe('left'); // Target node's left side faces source
      expect(result.x).toBe(200); // Left edge of target
    });

    it('should calculate correct intersection for nodes in a vertical flow', () => {
      // const sourceNode = createNode(50, 0, 100, 50);
      const targetNode = createNode(50, 200, 100, 50);

      // Calculate intersection on target node from source center
      const sourceCenter = { x: 100, y: 25 };
      const result = getNodeBorderIntersection(targetNode, sourceCenter);

      expect(result.side).toBe('top'); // Target node's top side faces source
      expect(result.y).toBe(200); // Top edge of target
    });

    it('should calculate correct intersection for diagonal node arrangement', () => {
      // const sourceNode = createNode(0, 0, 100, 50);
      const targetNode = createNode(200, 200, 100, 50);

      // Calculate intersection on target node from source center
      const sourceCenter = { x: 50, y: 25 };
      const result = getNodeBorderIntersection(targetNode, sourceCenter);

      // Nodes are diagonally arranged, should intersect top-left area
      expect(['left', 'top']).toContain(result.side);
    });
  });
});
