import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../flow-core';
import { mockNode } from '../test-utils';
import { getNearestNodeInRange, getNearestPortInRange, getNodesInRange, getNodesInRect } from './utils';

describe('SpatialHash utils', () => {
  const mockQueryIds = vi.fn();
  const mockGetState = vi.fn();
  let flowCore: FlowCore;

  beforeEach(() => {
    flowCore = {
      spatialHash: {
        queryIds: mockQueryIds,
      },
      getState: mockGetState,
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
      const node = { ...mockNode, id: '1' };
      mockGetState.mockReturnValue({
        nodes: [node, { ...mockNode, id: '3' }],
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

      expect(result).toEqual([node1, node2, node3]);
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
});
