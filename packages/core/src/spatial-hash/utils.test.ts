import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../flow-core';
import { mockNode } from '../test-utils';
import {
  doesRectsIntersect,
  getDistanceBetweenRects,
  getNearestNodeInRange,
  getNearestPortInRange,
  getNodesInRange,
  getPointRangeRect,
  getRect,
} from './utils';

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

  describe('getPointRangeRect', () => {
    it('should return a rect with the correct size', () => {
      const point = { x: 10, y: 10 };
      const range = 5;

      const result = getPointRangeRect(point, range);

      expect(result).toEqual({ x: 5, y: 5, width: 10, height: 10 });
    });
  });

  describe('getRect', () => {
    it('should return default properties if nothing passed', () => {
      const result = getRect({});

      expect(result).toEqual({ x: 0, y: 0, width: 1, height: 1 });
    });

    it('should return the correct properties if passed', () => {
      const result = getRect({ position: { x: 10, y: 10 }, size: { width: 10, height: 10 } });

      expect(result).toEqual({ x: 10, y: 10, width: 10, height: 10 });
    });
  });

  describe('doesRectsIntersect', () => {
    it('should return true if the rects intersects from the right', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 10, height: 10 } });
      const rect2 = getRect({ position: { x: 5, y: 5 }, size: { width: 10, height: 10 } });

      expect(doesRectsIntersect(rect1, rect2)).toBe(true);
    });

    it('should return true if the rects intersects from the left', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 10, height: 10 } });
      const rect2 = getRect({ position: { x: -5, y: -5 }, size: { width: 10, height: 10 } });

      expect(doesRectsIntersect(rect1, rect2)).toBe(true);
    });

    it('should return false if the rects do not intersect', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 10, height: 10 } });
      const rect2 = getRect({ position: { x: 15, y: 15 }, size: { width: 10, height: 10 } });

      expect(doesRectsIntersect(rect1, rect2)).toBe(false);
    });
  });

  describe('getDistanceBetweenRects', () => {
    it('should return 0 if rects intersects', () => {
      const rect1 = getRect({ position: { x: -1, y: -1 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(0);
    });

    it('should return euclidean distance between bottom right corner and top left corner if first rect above and on the left of the second rect', () => {
      const rect1 = getRect({ position: { x: -10, y: -10 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(Math.sqrt(5 ** 2 + 5 ** 2));
    });

    it('should return the distance between top and bottom of rects if first rect above the second rect', () => {
      const rect1 = getRect({ position: { x: 0, y: -10 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(5);
    });

    it('should return the euclidean distance between bottom left corner and top right corner if first rect above and on the right of the second rect', () => {
      const rect1 = getRect({ position: { x: 10, y: -10 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(Math.sqrt(5 ** 2 + 5 ** 2));
    });

    it('should return the distance between right and left of rects if first rect to the right of the second rect', () => {
      const rect1 = getRect({ position: { x: 10, y: 0 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(5);
    });

    it('should return euclidean distance between top left and bottom right corner of rects if first rect to the below and on the right of the second rect', () => {
      const rect1 = getRect({ position: { x: 10, y: 10 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(Math.sqrt(5 ** 2 + 5 ** 2));
    });

    it('should return the distance between top and bottom of rects if first rect below the second rect', () => {
      const rect1 = getRect({ position: { x: 0, y: 10 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(5);
    });

    it('should return euclidean distance between top right and bottom left corner of rects if first rect to the below and on the left of the second rect', () => {
      const rect1 = getRect({ position: { x: -10, y: 10 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(Math.sqrt(5 ** 2 + 5 ** 2));
    });

    it('should return the distance between right and left of rects if first rect to the left of the second rect', () => {
      const rect1 = getRect({ position: { x: -10, y: 0 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(5);
    });
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
        ports: [
          { id: '1', position: { x: 0, y: 0 }, size: { width: 2, height: 2 } },
          { id: '2', position: { x: 5, y: 5 }, size: { width: 2, height: 2 } },
        ],
      };
      const node2 = {
        ...mockNode,
        id: '2',
        position: { x: 10, y: 10 },
        size: { width: 5, height: 5 },
        ports: [{ id: '2', position: { x: 0, y: 0 }, size: { width: 2, height: 2 } }],
      };
      const node3 = {
        ...mockNode,
        id: '3',
        position: { x: 20, y: 20 },
        size: { width: 5, height: 5 },
        ports: [{ id: '3', position: { x: 0, y: 0 }, size: { width: 2, height: 2 } }],
      };

      mockGetState.mockReturnValue({
        nodes: [node1, node2, node3],
      });
      mockQueryIds.mockReturnValue(['1', '2', '3']);

      const result = getNearestPortInRange(flowCore, { x: 6, y: 6 }, 2);

      expect(result).toEqual(node1.ports[1]);
    });
  });
});
