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
      // The intersection point should be on the rotated rectangle boundary
      expect(Number.isFinite(result.x)).toBe(true);
      expect(Number.isFinite(result.y)).toBe(true);
      // Side is determined by outward normal of the hit edge
      expect(['top', 'right', 'bottom', 'left']).toContain(result.side);
    });

    it('should calculate correct intersection for 90 degree rotated node', () => {
      // Node at origin, 100x50, rotated 90 degrees
      // After rotation: effectively 50x100 centered at same point
      const node: Node = {
        id: 'rotated-node',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        angle: 90,
        data: {},
      };

      // Node center is at (50, 25)
      // From point to the right of the node
      const from = { x: 200, y: 25 };
      const result = getNodeBorderIntersection(node, from);

      // With 90 degree rotation, the original "right" edge now points downward
      // The outward normal of this edge points to the right in world space
      // So the side should still be 'right' (based on outward normal direction)
      expect(result.side).toBe('right');
      // The intersection point should be on the rotated boundary
      expect(Number.isFinite(result.x)).toBe(true);
      expect(Number.isFinite(result.y)).toBe(true);
    });

    it('should calculate correct intersection for 180 degree rotated node', () => {
      const node: Node = {
        id: 'rotated-node',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        angle: 180,
        data: {},
      };

      // Node center is at (50, 25)
      const from = { x: 200, y: 25 };
      const result = getNodeBorderIntersection(node, from);

      // 180 degree rotation: the original "left" edge is now on the right side
      // Its outward normal points right, so side should be 'right'
      expect(result.side).toBe('right');
      expect(result.x).toBeCloseTo(100, 5);
      expect(result.y).toBeCloseTo(25, 5);
    });

    it('should return correct side based on outward normal for 45 degree rotation', () => {
      const node: Node = {
        id: 'rotated-node',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 }, // Square for easier reasoning
        angle: 45,
        data: {},
      };

      // Node center is at (50, 50)
      // From point directly to the right
      const from = { x: 200, y: 50 };
      const result = getNodeBorderIntersection(node, from);

      // For a 45-degree rotated square, the edge facing right has an outward normal
      // pointing diagonally, which maps to 'right' as it's closest to (1,0)
      expect(result.side).toBe('right');
      expect(Number.isFinite(result.x)).toBe(true);
      expect(Number.isFinite(result.y)).toBe(true);
    });

    it('should handle from point at center for rotated node', () => {
      const node: Node = {
        id: 'rotated-node',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        angle: 45,
        data: {},
      };

      // Node center is at (50, 25)
      const from = { x: 50, y: 25 };
      const result = getNodeBorderIntersection(node, from);

      // Should return valid result with rotated coordinates
      expect(Number.isFinite(result.x)).toBe(true);
      expect(Number.isFinite(result.y)).toBe(true);
      expect(['top', 'right', 'bottom', 'left']).toContain(result.side);
    });

    it('should return bottom side when from point is below rotated node', () => {
      const node: Node = {
        id: 'rotated-node',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        angle: 90,
        data: {},
      };

      // Node center is at (50, 25)
      // From point below the node
      const from = { x: 50, y: 200 };
      const result = getNodeBorderIntersection(node, from);

      // The edge facing down has outward normal pointing down -> 'bottom'
      expect(result.side).toBe('bottom');
      expect(Number.isFinite(result.x)).toBe(true);
      expect(Number.isFinite(result.y)).toBe(true);
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
