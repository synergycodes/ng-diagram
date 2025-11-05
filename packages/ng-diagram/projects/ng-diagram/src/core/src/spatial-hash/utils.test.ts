import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../flow-core';
import { mockNode } from '../test-utils';
import type { Node } from '../types/node.interface';
import {
  getNearestNodeInRange,
  getNearestPortInRange,
  getNodesInRange,
  getNodesInRect,
  getOverlappingNodes,
} from './utils';

describe('SpatialHash utils', () => {
  const mockQueryIds = vi.fn();
  const mockGetState = vi.fn();
  const mockGetNodeById = vi.fn();
  let flowCore: FlowCore;

  beforeEach(() => {
    flowCore = {
      spatialHash: {
        queryIds: mockQueryIds,
      },
      getState: mockGetState,
      modelLookup: {
        getNodeById: mockGetNodeById,
      },
    } as unknown as FlowCore;
    vi.clearAllMocks();
  });

  describe('getNodesInRange', () => {
    it('should call queryIds with the correct parameters', () => {
      mockGetState.mockReturnValue({
        nodes: [],
      });

      getNodesInRange(flowCore, { x: 0, y: 0 }, 10);

      expect(mockQueryIds).toHaveBeenCalledWith({ x: -10, y: -10, width: 20, height: 20 });
    });

    it('should return nodes found by spatial hash and which exists in state', () => {
      const node = { ...mockNode, id: '1', size: { width: 100, height: 100 } };
      mockGetState.mockReturnValue({
        nodes: [node, { ...mockNode, id: '3', size: { width: 100, height: 100 } }],
      });
      mockQueryIds.mockReturnValue(['1', '2']);

      const result = getNodesInRange(flowCore, { x: 0, y: 0 }, 10);

      expect(result).toEqual([node]);
    });

    it('should return empty array if no nodes found', () => {
      mockGetState.mockReturnValue({
        nodes: [mockNode],
      });
      mockQueryIds.mockReturnValue([]);

      const result = getNodesInRange(flowCore, { x: 0, y: 0 }, 10);

      expect(result).toEqual([]);
    });
  });

  describe('getNearestNodeInRange', () => {
    it('should return null if there is no nodes in range', () => {
      mockGetState.mockReturnValue({
        nodes: [mockNode],
      });
      mockQueryIds.mockReturnValue([]);

      const result = getNearestNodeInRange(flowCore, { x: 0, y: 0 }, 10);

      expect(result).toBeNull();
    });

    it('should return nearest node in range', () => {
      const node1 = { ...mockNode, id: '1', position: { x: 0, y: 0 }, size: { width: 5, height: 5 } };
      const node2 = { ...mockNode, id: '2', position: { x: 10, y: 10 }, size: { width: 5, height: 5 } };
      const node3 = { ...mockNode, id: '3', position: { x: 20, y: 20 }, size: { width: 5, height: 5 } };

      mockGetState.mockReturnValue({
        nodes: [node1, node2, node3],
      });
      mockQueryIds.mockReturnValue(['1', '2', '3']);

      const result = getNearestNodeInRange(flowCore, { x: 0, y: 0 }, 10);

      expect(result).toEqual(node1);
    });
  });

  describe('getNearestPortInRange', () => {
    it('should return null if there is no ports in range', () => {
      mockGetState.mockReturnValue({
        nodes: [mockNode],
      });
      mockQueryIds.mockReturnValue([]);

      const result = getNearestPortInRange(flowCore, { x: 0, y: 0 }, 10);

      expect(result).toBeNull();
    });

    it('should return nearest port in range', () => {
      const node1 = {
        ...mockNode,
        id: '1',
        position: { x: 0, y: 0 },
        size: { width: 5, height: 5 },
        measuredPorts: [
          { id: '1', position: { x: 0, y: 0 }, size: { width: 2, height: 2 } },
          { id: '2', position: { x: 5, y: 5 }, size: { width: 2, height: 2 } },
        ],
      };
      const node2 = {
        ...mockNode,
        id: '2',
        position: { x: 10, y: 10 },
        size: { width: 5, height: 5 },
        measuredPorts: [{ id: '2', position: { x: 0, y: 0 }, size: { width: 2, height: 2 } }],
      };
      const node3 = {
        ...mockNode,
        id: '3',
        position: { x: 20, y: 20 },
        size: { width: 5, height: 5 },
        measuredPorts: [{ id: '3', position: { x: 0, y: 0 }, size: { width: 2, height: 2 } }],
      };

      mockGetState.mockReturnValue({
        nodes: [node1, node2, node3],
      });
      mockQueryIds.mockReturnValue(['1', '2', '3']);

      const result = getNearestPortInRange(flowCore, { x: 6, y: 6 }, 2);

      expect(result).toEqual(node1.measuredPorts[1]);
    });
  });

  describe('getNodesInRect', () => {
    it('should call queryIds with the correct rectangle parameters', () => {
      mockGetState.mockReturnValue({
        nodes: [],
      });

      const rect = { x: 10, y: 20, width: 100, height: 50 };
      getNodesInRect(flowCore, rect);

      expect(mockQueryIds).toHaveBeenCalledWith(rect);
    });

    it('should return nodes found by spatial hash and which exist in state', () => {
      const node1 = { ...mockNode, id: '1', position: { x: 0, y: 0 }, size: { width: 10, height: 10 } };
      const node2 = { ...mockNode, id: '2', position: { x: 20, y: 20 }, size: { width: 10, height: 10 } };
      const node3 = { ...mockNode, id: '3', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } };

      mockGetState.mockReturnValue({
        nodes: [node1, node2, node3],
      });
      mockQueryIds.mockReturnValue(['1', '2']);

      const result = getNodesInRect(flowCore, { x: 0, y: 0, width: 40, height: 40 });

      expect(result).toEqual([node1, node2]);
    });

    it('should return empty array if no nodes found', () => {
      mockGetState.mockReturnValue({
        nodes: [mockNode],
      });
      mockQueryIds.mockReturnValue([]);

      const result = getNodesInRect(flowCore, { x: 0, y: 0, width: 100, height: 100 });

      expect(result).toEqual([]);
    });

    it('should return all partially overlapping nodes when partialInclusion is true (default)', () => {
      const node1 = { ...mockNode, id: '1', position: { x: 0, y: 0 }, size: { width: 10, height: 10 } };
      const node2 = { ...mockNode, id: '2', position: { x: 15, y: 15 }, size: { width: 10, height: 10 } };
      const node3 = { ...mockNode, id: '3', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } };

      mockGetState.mockReturnValue({
        nodes: [node1, node2, node3],
      });
      mockQueryIds.mockReturnValue(['1', '2', '3']);

      const result = getNodesInRect(flowCore, { x: 5, y: 5, width: 15, height: 15 });

      expect(result).toEqual([node1, node2]);
    });

    it('should return all partially overlapping nodes when partialInclusion is explicitly true', () => {
      const node1 = { ...mockNode, id: '1', position: { x: 0, y: 0 }, size: { width: 10, height: 10 } };
      const node2 = { ...mockNode, id: '2', position: { x: 15, y: 15 }, size: { width: 10, height: 10 } };

      mockGetState.mockReturnValue({
        nodes: [node1, node2],
      });
      mockQueryIds.mockReturnValue(['1', '2']);

      const result = getNodesInRect(flowCore, { x: 5, y: 5, width: 15, height: 15 }, true);

      expect(result).toEqual([node1, node2]);
    });

    it('should return only fully contained nodes when partialInclusion is false', () => {
      const node1 = { ...mockNode, id: '1', position: { x: 10, y: 10 }, size: { width: 10, height: 10 } };
      const node2 = { ...mockNode, id: '2', position: { x: 25, y: 25 }, size: { width: 10, height: 10 } };
      const node3 = { ...mockNode, id: '3', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } };

      mockGetState.mockReturnValue({
        nodes: [node1, node2, node3],
      });
      mockQueryIds.mockReturnValue(['1', '2', '3']);

      const result = getNodesInRect(flowCore, { x: 5, y: 5, width: 20, height: 20 }, false);

      expect(result).toEqual([node1]);
    });

    it('should return empty array when no nodes are fully contained and partialInclusion is false', () => {
      const node1 = { ...mockNode, id: '1', position: { x: 0, y: 0 }, size: { width: 20, height: 20 } };
      const node2 = { ...mockNode, id: '2', position: { x: 15, y: 15 }, size: { width: 20, height: 20 } };

      mockGetState.mockReturnValue({
        nodes: [node1, node2],
      });
      mockQueryIds.mockReturnValue(['1', '2']);

      const result = getNodesInRect(flowCore, { x: 5, y: 5, width: 15, height: 15 }, false);

      expect(result).toEqual([]);
    });
  });

  describe('getOverlappingNodes', () => {
    it('should return empty array when nodeId does not exist', () => {
      mockGetNodeById.mockReturnValue(null);
      const result = getOverlappingNodes(flowCore, 'non-existent-id');

      expect(result).toEqual([]);
    });

    it('should return empty array when node exists but has no overlapping nodes', () => {
      const node1: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
      };
      const node2: Node = {
        ...mockNode,
        id: 'node2',
        position: { x: 200, y: 200 },
        size: { width: 100, height: 100 },
        measuredBounds: { x: 200, y: 200, width: 100, height: 100 },
      };

      mockGetNodeById.mockImplementation((id) => {
        if (id === 'node1') return node1;
        if (id === 'node2') return node2;
        return null;
      });
      mockGetState.mockReturnValue({
        nodes: [node1, node2],
      });
      mockQueryIds.mockReturnValue([]);

      const result = getOverlappingNodes(flowCore, 'node1');

      expect(result).toEqual([]);
    });

    it('should return overlapping node when nodes overlap', () => {
      const node1: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
      };
      const node2: Node = {
        ...mockNode,
        id: 'node2',
        position: { x: 50, y: 50 },
        size: { width: 100, height: 100 },
        measuredBounds: { x: 50, y: 50, width: 100, height: 100 },
      };

      mockGetNodeById.mockImplementation((id) => {
        if (id === 'node1') return node1;
        if (id === 'node2') return node2;
        return null;
      });
      mockGetState.mockReturnValue({
        nodes: [node1, node2],
      });
      mockQueryIds.mockReturnValue(['node1', 'node2']);

      const result = getOverlappingNodes(flowCore, 'node1');

      expect(result.map((n) => n.id)).toEqual(['node2']);
    });

    it('should return multiple overlapping nodes when node overlaps with several nodes', () => {
      const node1: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 50, y: 50 },
        size: { width: 100, height: 100 },
        measuredBounds: { x: 50, y: 50, width: 100, height: 100 },
      };
      const node2: Node = {
        ...mockNode,
        id: 'node2',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
      };
      const node3: Node = {
        ...mockNode,
        id: 'node3',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
        measuredBounds: { x: 100, y: 100, width: 100, height: 100 },
      };
      const node4: Node = {
        ...mockNode,
        id: 'node4',
        position: { x: 300, y: 300 },
        size: { width: 100, height: 100 },
        measuredBounds: { x: 300, y: 300, width: 100, height: 100 },
      };

      mockGetNodeById.mockImplementation((id) => {
        if (id === 'node1') return node1;
        if (id === 'node2') return node2;
        if (id === 'node3') return node3;
        if (id === 'node4') return node4;
        return null;
      });
      mockGetState.mockReturnValue({
        nodes: [node1, node2, node3, node4],
      });
      mockQueryIds.mockReturnValue(['node1', 'node2', 'node3']);

      const result = getOverlappingNodes(flowCore, 'node1');
      const resultIds = result.map((n) => n.id);

      expect(resultIds).toContain('node2');
      expect(resultIds).toContain('node3');
      expect(resultIds).not.toContain('node4');
      expect(resultIds.length).toBe(2);
    });

    it('should not include the queried node itself in the results', () => {
      const node1: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
      };
      const node2: Node = {
        ...mockNode,
        id: 'node2',
        position: { x: 50, y: 50 },
        size: { width: 100, height: 100 },
        measuredBounds: { x: 50, y: 50, width: 100, height: 100 },
      };

      mockGetNodeById.mockImplementation((id) => {
        if (id === 'node1') return node1;
        if (id === 'node2') return node2;
        return null;
      });
      mockGetState.mockReturnValue({
        nodes: [node1, node2],
      });
      mockQueryIds.mockReturnValue(['node1', 'node2']);

      const result = getOverlappingNodes(flowCore, 'node1');
      const resultIds = result.map((n) => n.id);

      expect(resultIds).not.toContain('node1');
      expect(resultIds).toEqual(['node2']);
    });

    it('should detect overlap when nodes rotated at different angles overlap but would not without rotation', () => {
      const node1: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 60, y: 300 },
        size: { width: 180, height: 43 },
        angle: 60,
        measuredBounds: { x: 32.8, y: 201.8, width: 234.4, height: 239.3 },
      };
      const node2: Node = {
        ...mockNode,
        id: 'node2',
        position: { x: 120, y: 390 },
        size: { width: 180, height: 43 },
        angle: 30,
        measuredBounds: { x: 106.82, y: 322.8, width: 206.3, height: 177.4 },
      };

      mockGetNodeById.mockImplementation((id) => {
        if (id === 'node1') return node1;
        if (id === 'node2') return node2;
        return null;
      });
      mockGetState.mockReturnValue({
        nodes: [node1, node2],
      });
      // Spatial hash returns both because measured bounds overlap
      mockQueryIds.mockReturnValue(['node1', 'node2']);

      const result = getOverlappingNodes(flowCore, 'node1');

      // The nodes should be detected as overlapping due to their different rotation angles
      expect(result.map((n) => n.id)).toEqual(['node2']);
    });

    it('should not detect overlap when bounding boxes overlap but rotated shapes do not actually collide', () => {
      const node1: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 120.26209932375951, y: 424.0976163450624 },
        size: { width: 180, height: 43 },
        angle: 60,
        measuredBounds: {
          x: 93.03005411368139,
          y: 325.9521139020447,
          width: 234.46409042015625,
          height: 239.29095417351067,
        },
      };
      const node2: Node = {
        ...mockNode,
        id: 'node2',
        position: { x: 230, y: 380 },
        size: { width: 180, height: 43 },
        angle: 0,
        measuredBounds: { x: 226.00002438635073, y: 380, width: 188.00006207434737, height: 43 },
      };

      mockGetNodeById.mockImplementation((id) => {
        if (id === 'node1') return node1;
        if (id === 'node2') return node2;
        return null;
      });
      mockGetState.mockReturnValue({
        nodes: [node1, node2],
      });

      mockQueryIds.mockReturnValue(['node1', 'node2']);

      const result = getOverlappingNodes(flowCore, 'node2');

      expect(result).toEqual([]);
    });

    it('should not consider edge-touching nodes as overlapping', () => {
      const node1: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
      };
      const node2: Node = {
        ...mockNode,
        id: 'node2',
        position: { x: 100, y: 0 },
        size: { width: 100, height: 100 },
        measuredBounds: { x: 100, y: 0, width: 100, height: 100 },
      };
      const node3: Node = {
        ...mockNode,
        id: 'node3',
        position: { x: 0, y: 100 },
        size: { width: 100, height: 100 },
        measuredBounds: { x: 0, y: 100, width: 100, height: 100 },
      };

      mockGetNodeById.mockImplementation((id) => {
        if (id === 'node1') return node1;
        if (id === 'node2') return node2;
        if (id === 'node3') return node3;
        return null;
      });
      mockGetState.mockReturnValue({
        nodes: [node1, node2, node3],
      });
      mockQueryIds.mockReturnValue([]);

      const result = getOverlappingNodes(flowCore, 'node1');

      expect(result).toEqual([]);
    });

    it('should work correctly when querying different nodes with the same overlaps', () => {
      const node1: Node = {
        ...mockNode,
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        measuredBounds: { x: 0, y: 0, width: 100, height: 100 },
      };
      const node2: Node = {
        ...mockNode,
        id: 'node2',
        position: { x: 50, y: 50 },
        size: { width: 100, height: 100 },
        measuredBounds: { x: 50, y: 50, width: 100, height: 100 },
      };
      const node3: Node = {
        ...mockNode,
        id: 'node3',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
        measuredBounds: { x: 100, y: 100, width: 100, height: 100 },
      };

      mockGetNodeById.mockImplementation((id) => {
        if (id === 'node1') return node1;
        if (id === 'node2') return node2;
        if (id === 'node3') return node3;
        return null;
      });
      mockGetState.mockReturnValue({
        nodes: [node1, node2, node3],
      });

      // For node1
      mockQueryIds.mockReturnValue(['node1', 'node2']);
      const result1 = getOverlappingNodes(flowCore, 'node1');

      // For node2
      mockQueryIds.mockReturnValue(['node1', 'node2', 'node3']);
      const result2 = getOverlappingNodes(flowCore, 'node2');

      // For node3
      mockQueryIds.mockReturnValue(['node2', 'node3']);
      const result3 = getOverlappingNodes(flowCore, 'node3');

      expect(result1.map((n) => n.id)).toEqual(['node2']);
      expect(result2.map((n) => n.id).sort()).toEqual(['node1', 'node3'].sort());
      expect(result3.map((n) => n.id)).toEqual(['node2']);
    });
  });
});
