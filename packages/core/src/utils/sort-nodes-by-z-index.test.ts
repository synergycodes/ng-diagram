import { describe, expect, it } from 'vitest';
import type { Node } from '../types/node.interface';
import { createNodeZIndexComparator, sortNodesByZIndex } from './sort-nodes-by-z-index';

describe('sortNodesByZIndex', () => {
  const createNode = (id: string, zIndex?: number): Node =>
    ({
      id,
      position: { x: 0, y: 0 },
      zIndex,
    }) as Node;

  describe('basic sorting', () => {
    it('should sort nodes by z-index from highest to lowest', () => {
      const nodes = [createNode('node1', 1), createNode('node2', 3), createNode('node3', 2)];
      const modelNodes = [...nodes];

      const sorted = sortNodesByZIndex(nodes, modelNodes);

      expect(sorted[0].id).toBe('node2'); // zIndex: 3
      expect(sorted[1].id).toBe('node3'); // zIndex: 2
      expect(sorted[2].id).toBe('node1'); // zIndex: 1
    });

    it('should handle undefined z-index as 0', () => {
      const nodes = [createNode('node1'), createNode('node2', 2), createNode('node3', -1)];
      const modelNodes = [...nodes];

      const sorted = sortNodesByZIndex(nodes, modelNodes);

      expect(sorted[0].id).toBe('node2'); // zIndex: 2
      expect(sorted[1].id).toBe('node1'); // zIndex: 0 (undefined)
      expect(sorted[2].id).toBe('node3'); // zIndex: -1
    });

    it('should handle negative z-indexes', () => {
      const nodes = [createNode('node1', -5), createNode('node2', 0), createNode('node3', -2), createNode('node4', 3)];
      const modelNodes = [...nodes];

      const sorted = sortNodesByZIndex(nodes, modelNodes);

      expect(sorted[0].id).toBe('node4'); // zIndex: 3
      expect(sorted[1].id).toBe('node2'); // zIndex: 0
      expect(sorted[2].id).toBe('node3'); // zIndex: -2
      expect(sorted[3].id).toBe('node1'); // zIndex: -5
    });
  });

  describe('equal z-index tiebreaker', () => {
    it('should use model position as tiebreaker when z-indexes are equal', () => {
      const nodes = [createNode('node1', 1), createNode('node2', 1), createNode('node3', 1)];
      // Model has different order
      const modelNodes = [createNode('node3', 1), createNode('node1', 1), createNode('node2', 1)];

      const sorted = sortNodesByZIndex(nodes, modelNodes);

      // node2 is last in model, so it comes first
      expect(sorted[0].id).toBe('node2');
      // node1 is second in model
      expect(sorted[1].id).toBe('node1');
      // node3 is first in model, so it comes last
      expect(sorted[2].id).toBe('node3');
    });

    it('should handle mixed z-indexes with some equal values', () => {
      const nodes = [createNode('node1', 2), createNode('node2', 1), createNode('node3', 2), createNode('node4', 1)];
      const modelNodes = [
        createNode('node1', 2),
        createNode('node2', 1),
        createNode('node3', 2),
        createNode('node4', 1),
      ];

      const sorted = sortNodesByZIndex(nodes, modelNodes);

      // z-index 2 nodes come first
      expect(sorted[0].id).toBe('node3'); // Later in model
      expect(sorted[1].id).toBe('node1'); // Earlier in model
      // z-index 1 nodes come next
      expect(sorted[2].id).toBe('node4'); // Later in model
      expect(sorted[3].id).toBe('node2'); // Earlier in model
    });
  });

  describe('edge cases', () => {
    it('should handle empty array', () => {
      const nodes: Node[] = [];
      const modelNodes: Node[] = [];

      const sorted = sortNodesByZIndex(nodes, modelNodes);

      expect(sorted).toEqual([]);
    });

    it('should handle single node', () => {
      const nodes = [createNode('node1', 5)];
      const modelNodes = [...nodes];

      const sorted = sortNodesByZIndex(nodes, modelNodes);

      expect(sorted).toHaveLength(1);
      expect(sorted[0].id).toBe('node1');
    });

    it('should not mutate original array', () => {
      const nodes = [createNode('node1', 1), createNode('node2', 3), createNode('node3', 2)];
      const originalNodes = [...nodes];
      const modelNodes = [...nodes];

      sortNodesByZIndex(nodes, modelNodes);

      expect(nodes).toEqual(originalNodes);
    });

    it('should handle large z-index values', () => {
      const nodes = [createNode('node1', 1000000), createNode('node2', 999999), createNode('node3', 1000001)];
      const modelNodes = [...nodes];

      const sorted = sortNodesByZIndex(nodes, modelNodes);

      expect(sorted[0].id).toBe('node3'); // 1000001
      expect(sorted[1].id).toBe('node1'); // 1000000
      expect(sorted[2].id).toBe('node2'); // 999999
    });
  });

  describe('real-world scenarios', () => {
    it('should correctly sort groups and nodes with various z-indexes', () => {
      const nodes = [
        createNode('background', -10),
        createNode('group1', 0),
        createNode('node1', 1),
        createNode('group2', 0),
        createNode('node2', 2),
        createNode('overlay', 100),
      ];
      const modelNodes = [
        createNode('background', -10),
        createNode('group1', 0),
        createNode('group2', 0),
        createNode('node1', 1),
        createNode('node2', 2),
        createNode('overlay', 100),
      ];

      const sorted = sortNodesByZIndex(nodes, modelNodes);

      expect(sorted[0].id).toBe('overlay'); // zIndex: 100
      expect(sorted[1].id).toBe('node2'); // zIndex: 2
      expect(sorted[2].id).toBe('node1'); // zIndex: 1
      expect(sorted[3].id).toBe('group2'); // zIndex: 0, later in model
      expect(sorted[4].id).toBe('group1'); // zIndex: 0, earlier in model
      expect(sorted[5].id).toBe('background'); // zIndex: -10
    });

    it('should handle partial node list from full model', () => {
      const modelNodes = [
        createNode('node1', 1),
        createNode('node2', 2),
        createNode('node3', 1),
        createNode('node4', 3),
        createNode('node5', 1),
      ];
      // Only sorting some nodes from the model
      const nodesToSort = [
        modelNodes[0], // node1
        modelNodes[2], // node3
        modelNodes[4], // node5
      ];

      const sorted = sortNodesByZIndex(nodesToSort, modelNodes);

      // All have zIndex 1, so order by model position
      expect(sorted[0].id).toBe('node5'); // Latest in model
      expect(sorted[1].id).toBe('node3'); // Middle in model
      expect(sorted[2].id).toBe('node1'); // Earliest in model
    });
  });
});

describe('createNodeZIndexComparator', () => {
  const createNode = (id: string, zIndex?: number): Node =>
    ({
      id,
      position: { x: 0, y: 0 },
      zIndex,
    }) as Node;

  it('should create a reusable comparator function', () => {
    const modelNodes = [createNode('node1', 1), createNode('node2', 3), createNode('node3', 2)];
    const comparator = createNodeZIndexComparator(modelNodes);

    const nodes = [...modelNodes];
    nodes.sort(comparator);

    expect(nodes[0].id).toBe('node2'); // zIndex: 3
    expect(nodes[1].id).toBe('node3'); // zIndex: 2
    expect(nodes[2].id).toBe('node1'); // zIndex: 1
  });

  it('should maintain consistent sorting when used multiple times', () => {
    const modelNodes = [createNode('node1', 1), createNode('node2', 1), createNode('node3', 2)];
    const comparator = createNodeZIndexComparator(modelNodes);

    const nodes1 = [...modelNodes];
    const nodes2 = [...modelNodes].reverse();

    nodes1.sort(comparator);
    nodes2.sort(comparator);

    expect(nodes1.map((n) => n.id)).toEqual(nodes2.map((n) => n.id));
  });

  it('should be efficient for multiple sorts with same model', () => {
    const modelNodes = Array.from({ length: 100 }, (_, i) => createNode(`node${i}`, Math.floor(Math.random() * 10)));
    const comparator = createNodeZIndexComparator(modelNodes);

    // Use the same comparator multiple times
    const nodes1 = [...modelNodes].sort(comparator);
    const nodes2 = [...modelNodes].sort(comparator);
    const nodes3 = [...modelNodes].sort(comparator);

    // All sorts should produce the same result
    expect(nodes1.map((n) => n.id)).toEqual(nodes2.map((n) => n.id));
    expect(nodes2.map((n) => n.id)).toEqual(nodes3.map((n) => n.id));
  });
});
