import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../flow-core';
import { mockNode } from '../test-utils';
import { getNearestNodeInRange, getNearestPortInRange, getNodesInRange } from './utils';

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
});
