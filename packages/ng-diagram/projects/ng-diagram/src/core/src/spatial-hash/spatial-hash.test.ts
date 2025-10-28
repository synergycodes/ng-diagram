import { beforeEach, describe, expect, it } from 'vitest';
import { mockNode } from '../test-utils';
import { Node } from '../types';
import { SpatialHash } from './spatial-hash';

describe('SpatialHash', () => {
  let spatialHash: SpatialHash;

  beforeEach(() => {
    const node1 = {
      ...mockNode,
      id: '1',
      position: { x: 0, y: 0 },
      size: { width: 20, height: 20 },
      measuredPorts: [
        {
          id: 'port-1',
          type: 'both',
          position: { x: -4, y: 6 },
          size: { width: 8, height: 8 },
          nodeId: '1',
          side: 'left',
        },
        {
          id: 'port-2',
          type: 'both',
          position: { x: 6, y: -4 },
          size: { width: 8, height: 8 },
          nodeId: '2',
          side: 'top',
        },
        {
          id: 'port-3',
          type: 'both',
          position: { x: 6, y: 16 },
          size: { width: 8, height: 8 },
          nodeId: '3',
          side: 'bottom',
        },
        {
          id: 'port-4',
          type: 'both',
          position: { x: 16, y: 6 },
          size: { width: 8, height: 8 },
          nodeId: '4',
          side: 'right',
        },
      ],
    } satisfies Node;
    const node2 = {
      ...mockNode,
      id: '2',
      position: { x: 100, y: 50 },
      size: { width: 20, height: 20 },
    } satisfies Node;
    const node3 = {
      ...mockNode,
      id: '3',
      position: { x: 100, y: 100 },
      size: { width: 20, height: 20 },
    } satisfies Node;
    const nodes: Node[] = [node1, node2, node3];
    spatialHash = new SpatialHash();
    spatialHash.process(nodes);
  });

  it('should find all nodes in a huge range', () => {
    const range = {
      x: 0,
      y: 0,
      width: 1000,
      height: 1000,
    };

    const result = spatialHash.queryIds(range);

    expect(result).toEqual(['1', '2', '3']);
  });

  it('should find proper node in close range', () => {
    const range = {
      x: -4,
      y: -4,
      width: 1,
      height: 1,
    };

    const result = spatialHash.queryIds(range);

    expect(result).toEqual(['1']);
  });

  it('should find nearest two nodes if range is between them', () => {
    const range = {
      x: 100,
      y: 45,
      width: 10,
      height: 60,
    };

    const result = spatialHash.queryIds(range);

    expect(result).toEqual(['2', '3']);
  });

  it('should find nearest node if range close to the port', () => {
    const range = {
      x: -5,
      y: 14,
      width: 2,
      height: 2,
    };

    const result = spatialHash.queryIds(range);

    expect(result).toEqual(['1']);
  });

  it('should find all nodes if range in between them', () => {
    const range = {
      x: 19,
      y: 19,
      width: 90,
      height: 90,
    };

    const result = spatialHash.queryIds(range);

    expect(result).toEqual(['1', '2', '3']);
  });

  describe('getOverlappingNodes', () => {
    it('should return empty array when nodeId does not exist', () => {
      const result = spatialHash.getOverlappingNodes('non-existent-id');

      expect(result).toEqual([]);
    });

    it('should return empty array when node exists but has no overlapping nodes', () => {
      const nodes: Node[] = [
        {
          ...mockNode,
          id: 'node1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
        },
        {
          ...mockNode,
          id: 'node2',
          position: { x: 200, y: 200 },
          size: { width: 100, height: 100 },
        },
      ];

      spatialHash.process(nodes);
      const result = spatialHash.getOverlappingNodes('node1');

      expect(result).toEqual([]);
    });

    it('should return overlapping node when nodes overlap', () => {
      const nodes: Node[] = [
        {
          ...mockNode,
          id: 'node1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
        },
        {
          ...mockNode,
          id: 'node2',
          position: { x: 50, y: 50 },
          size: { width: 100, height: 100 },
        },
      ];

      spatialHash.process(nodes);
      const result = spatialHash.getOverlappingNodes('node1');

      expect(result).toEqual(['node2']);
    });

    it('should return multiple overlapping nodes when node overlaps with several nodes', () => {
      const nodes: Node[] = [
        {
          ...mockNode,
          id: 'node1',
          position: { x: 50, y: 50 },
          size: { width: 100, height: 100 },
        },
        {
          ...mockNode,
          id: 'node2',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
        },
        {
          ...mockNode,
          id: 'node3',
          position: { x: 100, y: 100 },
          size: { width: 100, height: 100 },
        },
        {
          ...mockNode,
          id: 'node4',
          position: { x: 300, y: 300 },
          size: { width: 100, height: 100 },
        },
      ];

      spatialHash.process(nodes);
      const result = spatialHash.getOverlappingNodes('node1');

      expect(result).toContain('node2');
      expect(result).toContain('node3');
      expect(result).not.toContain('node4');
      expect(result.length).toBe(2);
    });

    it('should not include the queried node itself in the results', () => {
      const nodes: Node[] = [
        {
          ...mockNode,
          id: 'node1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
        },
        {
          ...mockNode,
          id: 'node2',
          position: { x: 50, y: 50 },
          size: { width: 100, height: 100 },
        },
      ];

      spatialHash.process(nodes);
      const result = spatialHash.getOverlappingNodes('node1');

      expect(result).not.toContain('node1');
      expect(result).toEqual(['node2']);
    });

    it('should not consider edge-touching nodes as overlapping', () => {
      const nodes: Node[] = [
        {
          ...mockNode,
          id: 'node1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
        },
        {
          ...mockNode,
          id: 'node2',
          position: { x: 100, y: 0 },
          size: { width: 100, height: 100 },
        },
      ];

      spatialHash.process(nodes);
      const result = spatialHash.getOverlappingNodes('node1');

      expect(result).toEqual([]);
    });

    it('should return empty array after overlapping node is removed', () => {
      const initialNodes: Node[] = [
        {
          ...mockNode,
          id: 'node1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
        },
        {
          ...mockNode,
          id: 'node2',
          position: { x: 50, y: 50 },
          size: { width: 100, height: 100 },
        },
      ];

      spatialHash.process(initialNodes);

      const updatedNodes: Node[] = [
        {
          ...mockNode,
          id: 'node1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
        },
      ];

      spatialHash.process(updatedNodes);
      const result = spatialHash.getOverlappingNodes('node1');

      expect(result).toEqual([]);
    });

    it('should work correctly when querying different nodes with same overlaps', () => {
      const nodes: Node[] = [
        {
          ...mockNode,
          id: 'node1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
        },
        {
          ...mockNode,
          id: 'node2',
          position: { x: 50, y: 50 },
          size: { width: 100, height: 100 },
        },
      ];

      spatialHash.process(nodes);

      const result1 = spatialHash.getOverlappingNodes('node1');
      const result2 = spatialHash.getOverlappingNodes('node2');

      expect(result1).toEqual(['node2']);
      expect(result2).toEqual(['node1']);
    });
  });
});
