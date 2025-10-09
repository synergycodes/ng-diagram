import { describe, expect, it } from 'vitest';
import { mockGroupNode, mockNode } from '../../test-utils';
import type { GroupNode, Node } from '../../types';
import { calculateGroupBounds, calculateGroupRect } from '../group-size';

describe('Group Size Utils', () => {
  describe('calculateGroupBounds', () => {
    it('should return group bounds when no child nodes are present', () => {
      const group: GroupNode = {
        ...mockGroupNode,
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
      };

      const bounds = calculateGroupBounds([], group, { allowResizeBelowChildrenBounds: false });

      expect(bounds).toEqual({
        minX: 100,
        minY: 100,
        maxX: 300,
        maxY: 250,
      });
    });

    it('should throw error if group has no size', () => {
      const group: GroupNode = {
        ...mockGroupNode,
        position: { x: 100, y: 100 },
        size: undefined,
      };

      expect(() => calculateGroupBounds([], group)).toThrow('Group must have both width and height defined');
    });

    it('should throw error if group has partial size', () => {
      const groupWithWidthOnly: GroupNode = {
        ...mockGroupNode,
        position: { x: 100, y: 100 },
        size: { width: 200, height: undefined! },
      };

      const groupWithHeightOnly: GroupNode = {
        ...mockGroupNode,
        position: { x: 100, y: 100 },
        size: { width: undefined!, height: 150 },
      };

      expect(() => calculateGroupBounds([], groupWithWidthOnly)).toThrow();
      expect(() => calculateGroupBounds([], groupWithHeightOnly)).toThrow();
    });

    it('should calculate bounds from single child node', () => {
      const group: GroupNode = {
        ...mockGroupNode,
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
      };

      const childNode: Node = {
        ...mockNode,
        position: { x: 150, y: 120 },
        size: { width: 50, height: 40 },
      };

      const bounds = calculateGroupBounds([childNode], group, { allowResizeBelowChildrenBounds: false });

      expect(bounds).toEqual({
        minX: 100,
        minY: 100,
        maxX: 300,
        maxY: 250,
      });
    });

    it('should calculate bounds from multiple child nodes', () => {
      const group: GroupNode = {
        ...mockGroupNode,
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
      };

      const childNodes: Node[] = [
        {
          ...mockNode,
          position: { x: 50, y: 50 },
          size: { width: 50, height: 40 },
        },
        {
          ...mockNode,
          position: { x: 300, y: 300 },
          size: { width: 60, height: 45 },
        },
      ];

      const bounds = calculateGroupBounds(childNodes, group, { allowResizeBelowChildrenBounds: false });

      expect(bounds).toEqual({
        minX: 50,
        minY: 50,
        maxX: 360, // rightmost node x (300) + width (60)
        maxY: 345, // bottommost node y (300) + height (45)
      });
    });

    it('should ignore group bounds when useGroupRect is false', () => {
      const group: GroupNode = {
        ...mockGroupNode,
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
      };

      const childNodes: Node[] = [
        {
          ...mockNode,
          position: { x: 50, y: 50 },
          size: { width: 50, height: 40 },
        },
        {
          ...mockNode,
          position: { x: 300, y: 300 },
          size: { width: 60, height: 45 },
        },
      ];

      const bounds = calculateGroupBounds(childNodes, group, {
        useGroupRect: false,
        allowResizeBelowChildrenBounds: false,
      });

      expect(bounds).toEqual({
        minX: 50,
        minY: 50,
        maxX: 360,
        maxY: 345,
      });
    });

    it('should throw error if child node has partial size', () => {
      const group: GroupNode = {
        ...mockGroupNode,
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
      };

      const childNodes: Node[] = [
        {
          ...mockGroupNode,
          position: { x: 50, y: 50 },
          size: { width: 50, height: undefined! }, // missing height
        },
      ];

      expect(() => calculateGroupBounds(childNodes, group, { allowResizeBelowChildrenBounds: false })).toThrow();

      const childNodesWithHeightOnly: Node[] = [
        {
          ...mockGroupNode,
          position: { x: 300, y: 300 },
          size: { width: undefined!, height: 45 }, // missing width
        },
      ];

      expect(() =>
        calculateGroupBounds(childNodesWithHeightOnly, group, { allowResizeBelowChildrenBounds: false })
      ).toThrow();
    });
  });

  describe('calculateGroupRect', () => {
    it('should convert bounds to rect for empty group', () => {
      const group: GroupNode = {
        ...mockGroupNode,
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
      };

      const rect = calculateGroupRect([], group);

      expect(rect).toEqual({
        x: Infinity,
        y: Infinity,
        width: -Infinity,
        height: -Infinity,
      });
    });

    it('should throw error if group has partial size', () => {
      const group: GroupNode = {
        ...mockGroupNode,
        position: { x: 100, y: 100 },
        size: { width: 200, height: undefined! }, // missing height
      };

      expect(() => calculateGroupRect([], group)).toThrow();
    });

    it('should convert bounds to rect for group with children', () => {
      const group: GroupNode = {
        ...mockGroupNode,
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
      };

      const childNodes: Node[] = [
        {
          ...mockGroupNode,
          position: { x: 50, y: 50 },
          size: { width: 50, height: 40 },
        },
        {
          ...mockGroupNode,
          position: { x: 300, y: 300 },
          size: { width: 60, height: 45 },
        },
      ];

      const rect = calculateGroupRect(childNodes, group);

      expect(rect).toEqual({
        x: Infinity,
        y: Infinity,
        width: -Infinity,
        height: -Infinity,
      });
    });

    it('should handle nodes outside group bounds', () => {
      const group: GroupNode = {
        ...mockGroupNode,
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
      };

      const childNodes: Node[] = [
        {
          ...mockGroupNode,
          position: { x: 0, y: 0 },
          size: { width: 50, height: 50 },
        },
        {
          ...mockGroupNode,
          position: { x: 300, y: 300 },
          size: { width: 50, height: 50 },
        },
      ];

      const rect = calculateGroupRect(childNodes, group);

      expect(rect).toEqual({
        x: Infinity,
        y: Infinity,
        width: -Infinity,
        height: -Infinity,
      });
    });

    it('should respect useGroupRect option', () => {
      const group: GroupNode = {
        ...mockGroupNode,
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
      };

      const childNodes: Node[] = [
        {
          ...mockNode,
          position: { x: 150, y: 150 },
          size: { width: 50, height: 50 },
        },
      ];

      const rectWithGroup = calculateGroupRect(childNodes, group, { useGroupRect: true });
      const rectWithoutGroup = calculateGroupRect(childNodes, group, { useGroupRect: false });

      expect(rectWithGroup).toEqual({
        x: Infinity,
        y: Infinity,
        width: -Infinity,
        height: -Infinity,
      });

      expect(rectWithoutGroup).toEqual({
        x: Infinity,
        y: Infinity,
        width: -Infinity,
        height: -Infinity,
      });
    });

    it('should handle overlapping nodes', () => {
      const group: GroupNode = {
        ...mockGroupNode,
        position: { x: 100, y: 100 },
        size: { width: 200, height: 200 },
      };

      const childNodes: Node[] = [
        {
          ...mockNode,
          position: { x: 150, y: 150 },
          size: { width: 100, height: 100 },
        },
        {
          ...mockNode,
          position: { x: 200, y: 200 },
          size: { width: 100, height: 100 },
        },
      ];

      const rect = calculateGroupRect(childNodes, group);

      expect(rect).toEqual({
        x: Infinity,
        y: Infinity,
        width: -Infinity,
        height: -Infinity,
      });
    });

    it('should handle nodes with negative positions', () => {
      const group: GroupNode = {
        ...mockGroupNode,
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      };

      const childNodes: Node[] = [
        {
          ...mockNode,
          position: { x: -50, y: -50 },
          size: { width: 50, height: 50 },
        },
        {
          ...mockNode,
          position: { x: 50, y: 50 },
          size: { width: 50, height: 50 },
        },
      ];

      const rect = calculateGroupRect(childNodes, group);

      expect(rect).toEqual({
        x: Infinity,
        y: Infinity,
        width: -Infinity,
        height: -Infinity,
      });
    });
  });
});
