import { describe, expect, it } from 'vitest';
import { Bounds } from '../../../../types';
import { LayoutAngleType, TreeNode } from '../../../../types/tree-layout.interface.ts';
import { getNodeSize, groupLayout, isLeafNode, maybeShiftChildren, shiftSubtree } from './tree-layout-utils.ts';

describe('isLeafNode', () => {
  it('should return true for node with no children', () => {
    const node: TreeNode = {
      id: 'test',
      position: { x: 0, y: 0 },
      children: [],
      type: 'Test',
      isGroup: false,
    };

    expect(isLeafNode(node)).toBe(true);
  });

  it('should return true for node with undefined children', () => {
    const node: TreeNode = {
      id: 'test',
      position: { x: 0, y: 0 },
      children: undefined!,
      type: 'Test',
      isGroup: false,
    };

    expect(isLeafNode(node)).toBe(true);
  });

  it('should return false for node with children', () => {
    const child: TreeNode = {
      id: 'child',
      position: { x: 0, y: 0 },
      children: [],
      type: 'Test',
      isGroup: false,
    };
    const node: TreeNode = {
      id: 'test',
      position: { x: 0, y: 0 },
      children: [child],
      type: 'Test',
      isGroup: false,
    };

    expect(isLeafNode(node)).toBe(false);
  });
});

describe('getNodeSize', () => {
  it('should return node size when size is defined', () => {
    const node: TreeNode = {
      id: 'test',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 50 },
      children: [],
      type: 'Test',
      isGroup: false,
    };

    expect(getNodeSize(node)).toEqual({ width: 100, height: 50 });
  });

  it('should return default size when size is undefined', () => {
    const node: TreeNode = {
      id: 'test',
      position: { x: 0, y: 0 },
      children: [],
      type: 'Test',
      isGroup: false,
    };

    expect(getNodeSize(node)).toEqual({ width: 0, height: 0 });
  });

  it('should return default size when size is null', () => {
    const node: TreeNode = {
      id: 'test',
      position: { x: 0, y: 0 },
      size: null!,
      children: [],
      type: 'Test',
      isGroup: false,
    };

    expect(getNodeSize(node)).toEqual({ width: 0, height: 0 });
  });
});

describe('groupLayout', () => {
  it('should move all nodes by delta', () => {
    const child1: TreeNode = {
      id: 'child1',
      position: { x: 10, y: 20 },
      children: [],
      type: 'Test',
      isGroup: false,
    };
    const child2: TreeNode = {
      id: 'child2',
      position: { x: 30, y: 40 },
      children: [],
      type: 'Test',
      isGroup: false,
    };
    const groupChildren = [child1, child2];
    const delta = { x: 5, y: 10 };

    groupLayout(groupChildren, delta);

    expect(child1.position).toEqual({ x: 15, y: 30 });
    expect(child2.position).toEqual({ x: 35, y: 50 });
  });

  it('should recursively move nested group children', () => {
    const nestedChild: TreeNode = {
      id: 'nested',
      position: { x: 5, y: 15 },
      children: [],
      type: 'Test',
      isGroup: false,
    };
    const parent: TreeNode = {
      id: 'parent',
      position: { x: 10, y: 20 },
      children: [],
      groupChildren: [nestedChild],
      type: 'group',
      isGroup: true,
    };
    const groupChildren = [parent];
    const delta = { x: 5, y: 10 };

    groupLayout(groupChildren, delta);

    expect(parent.position).toEqual({ x: 15, y: 30 });
    expect(nestedChild.position).toEqual({ x: 10, y: 25 });
  });

  it('should handle empty groupChildren array', () => {
    const groupChildren: TreeNode[] = [];
    const delta = { x: 5, y: 10 };

    expect(() => groupLayout(groupChildren, delta)).not.toThrow();
  });

  it('should handle zero delta', () => {
    const child: TreeNode = {
      id: 'child',
      position: { x: 10, y: 20 },
      children: [],
      type: 'Test',
      isGroup: false,
    };
    const groupChildren = [child];
    const delta = { x: 0, y: 0 };

    groupLayout(groupChildren, delta);

    expect(child.position).toEqual({ x: 10, y: 20 });
  });

  it('should handle negative delta', () => {
    const child: TreeNode = {
      id: 'child',
      position: { x: 10, y: 20 },
      children: [],
      type: 'Test',
      isGroup: false,
    };
    const groupChildren = [child];
    const delta = { x: -5, y: -10 };

    groupLayout(groupChildren, delta);

    expect(child.position).toEqual({ x: 5, y: 10 });
  });
});

describe('shiftSubtree', () => {
  it('should move node and all children', () => {
    const grandchild: TreeNode = {
      id: 'grandchild',
      position: { x: 0, y: 0 },
      children: [],
      type: 'Test',
      isGroup: false,
    };
    const child: TreeNode = {
      id: 'child',
      position: { x: 10, y: 20 },
      children: [grandchild],
      type: 'Test',
      isGroup: false,
    };
    const root: TreeNode = {
      id: 'root',
      position: { x: 5, y: 15 },
      children: [child],
      type: 'Test',
      isGroup: false,
    };

    shiftSubtree(root, 10, 5);

    expect(root.position).toEqual({ x: 15, y: 20 });
    expect(child.position).toEqual({ x: 20, y: 25 });
    expect(grandchild.position).toEqual({ x: 10, y: 5 });
  });

  it('should handle node with no children', () => {
    const node: TreeNode = {
      id: 'node',
      position: { x: 10, y: 20 },
      children: [],
      type: 'Test',
      isGroup: false,
    };

    shiftSubtree(node, 5, 10);

    expect(node.position).toEqual({ x: 15, y: 30 });
  });

  it('should handle node with undefined children', () => {
    const node: TreeNode = {
      id: 'node',
      position: { x: 10, y: 20 },
      children: undefined!,
      type: 'Test',
      isGroup: false,
    };

    expect(() => shiftSubtree(node, 5, 10)).not.toThrow();
    expect(node.position).toEqual({ x: 15, y: 30 });
  });

  it('should handle zero shifts', () => {
    const child: TreeNode = {
      id: 'child',
      position: { x: 10, y: 20 },
      children: [],
      type: 'Test',
      isGroup: false,
    };
    const node: TreeNode = {
      id: 'node',
      position: { x: 5, y: 15 },
      children: [child],
      type: 'Test',
      isGroup: false,
    };

    shiftSubtree(node, 0, 0);

    expect(node.position).toEqual({ x: 5, y: 15 });
    expect(child.position).toEqual({ x: 10, y: 20 });
  });

  it('should handle negative shifts', () => {
    const child: TreeNode = {
      id: 'child',
      position: { x: 10, y: 20 },
      children: [],
      type: 'Test',
      isGroup: false,
    };
    const node: TreeNode = {
      id: 'node',
      position: { x: 5, y: 15 },
      children: [child],
      type: 'Test',
      isGroup: false,
    };

    shiftSubtree(node, -2, -5);

    expect(node.position).toEqual({ x: 3, y: 10 });
    expect(child.position).toEqual({ x: 8, y: 15 });
  });
});

describe('maybeShiftChildren', () => {
  const createMockParentNode = (size?: { width: number; height: number }): TreeNode => ({
    id: 'parent',
    position: { x: 0, y: 0 },
    size,
    children: [
      {
        id: 'child1',
        position: { x: 10, y: 10 },
        children: [],
        type: 'Test',
        isGroup: false,
      },
      {
        id: 'child2',
        position: { x: 20, y: 20 },
        children: [],
        type: 'Test',
        isGroup: false,
      },
    ],
    type: 'Test',
    isGroup: false,
  });

  const createMockBounds = (): Bounds => ({
    minX: 10,
    minY: 10,
    maxX: 30,
    maxY: 30,
  });

  it('should return early when parent sign is -1 and layout directions match', () => {
    const parentNode = createMockParentNode();
    const bounds = createMockBounds();
    const parentAngle: LayoutAngleType = 180; // sign = -1, horizontal
    const grandparentAngle: LayoutAngleType = 0; // horizontal
    const parentOffset = { x: 0, y: 0 };

    const originalChildPositions = parentNode.children.map((child) => ({ ...child.position }));

    maybeShiftChildren(parentNode, parentAngle, parentOffset, bounds, grandparentAngle);

    // Children should not be moved
    parentNode.children.forEach((child, index) => {
      expect(child.position).toEqual(originalChildPositions[index]);
    });
  });

  it('should center children horizontally when parent is vertical and wider than children', () => {
    const parentNode = createMockParentNode({ width: 50, height: 30 });
    const bounds = createMockBounds(); // childrenWidth = 20
    const parentAngle: LayoutAngleType = 90; // vertical
    const grandparentAngle: LayoutAngleType = 0; // horizontal
    const parentOffset = { x: 5, y: 5 };

    maybeShiftChildren(parentNode, parentAngle, parentOffset, bounds, grandparentAngle);

    // Expected shift: (50 - 20) / 2 + 5 - 10 = 15 + 5 - 10 = 10
    expect(parentNode.children[0].position.x).toBe(20);
    expect(parentNode.children[1].position.x).toBe(30);
  });

  it('should center children vertically when parent is horizontal and taller than children', () => {
    const parentNode = createMockParentNode({ width: 30, height: 50 });
    const bounds = createMockBounds(); // childrenHeight = 20
    const parentAngle: LayoutAngleType = 0; // horizontal
    const grandparentAngle: LayoutAngleType = 90; // vertical
    const parentOffset = { x: 5, y: 5 };

    maybeShiftChildren(parentNode, parentAngle, parentOffset, bounds, grandparentAngle);

    // Expected shift: (50 - 20) / 2 + 5 - 10 = 15 + 5 - 10 = 10
    expect(parentNode.children[0].position.y).toBe(20);
    expect(parentNode.children[1].position.y).toBe(30);
  });

  it('should shift children to respect parent offset bounds', () => {
    const parentNode = createMockParentNode();
    const bounds: Bounds = {
      minX: -5, // Less than parentOffset.x = 5
      minY: -3, // Less than parentOffset.y = 7
      maxX: 15,
      maxY: 17,
    };
    const parentAngle: LayoutAngleType = 90;
    const grandparentAngle: LayoutAngleType = 0;
    const parentOffset = { x: 5, y: 7 };

    maybeShiftChildren(parentNode, parentAngle, parentOffset, bounds, grandparentAngle);

    // deltaX = 5 - (-5) = 10, deltaY = 7 - (-3) = 10
    // Parent and all children should be shifted by deltaX and deltaY
    expect(parentNode.position.x).toBe(10); // 0 + 10
    expect(parentNode.position.y).toBe(10); // 0 + 10
    expect(parentNode.children[0].position.x).toBe(20); // 10 + 10
    expect(parentNode.children[0].position.y).toBe(20); // 10 + 10
  });

  it('should update bounds when children are shifted', () => {
    const parentNode = createMockParentNode({ width: 50, height: 30 });
    const bounds = createMockBounds();
    const originalBounds = { ...bounds };
    const parentAngle: LayoutAngleType = 90;
    const grandparentAngle: LayoutAngleType = 0;
    const parentOffset = { x: 5, y: 5 };

    maybeShiftChildren(parentNode, parentAngle, parentOffset, bounds, grandparentAngle);

    // Bounds should be updated after centering
    expect(bounds.minX).not.toBe(originalBounds.minX);
    expect(bounds.maxX).not.toBe(originalBounds.maxX);
  });

  it('should handle node without size', () => {
    const parentNode = createMockParentNode(); // no size provided
    const bounds = createMockBounds();
    const parentAngle: LayoutAngleType = 90;
    const grandparentAngle: LayoutAngleType = 0;
    const parentOffset = { x: 0, y: 0 };

    expect(() => maybeShiftChildren(parentNode, parentAngle, parentOffset, bounds, grandparentAngle)).not.toThrow();
  });

  it('should handle all layout angle combinations', () => {
    const angles: LayoutAngleType[] = [0, 90, 180, 270];
    const parentNode = createMockParentNode({ width: 50, height: 50 });
    const bounds = createMockBounds();
    const parentOffset = { x: 0, y: 0 };

    angles.forEach((parentAngle) => {
      angles.forEach((grandparentAngle) => {
        const testBounds = { ...bounds };
        expect(() =>
          maybeShiftChildren(parentNode, parentAngle, parentOffset, testBounds, grandparentAngle)
        ).not.toThrow();
      });
    });
  });

  it('should not shift when children are already within bounds', () => {
    const parentNode = createMockParentNode();
    const bounds: Bounds = {
      minX: 10,
      minY: 10,
      maxX: 30,
      maxY: 30,
    };
    const parentAngle: LayoutAngleType = 90;
    const grandparentAngle: LayoutAngleType = 0;
    const parentOffset = { x: 5, y: 5 };

    const originalParentPosition = { ...parentNode.position };

    maybeShiftChildren(parentNode, parentAngle, parentOffset, bounds, grandparentAngle);

    // When deltaX and deltaY are <= 0, no shifting should occur for the offset constraint
    // But centering might still occur due to size differences
    expect(parentNode.position.x).toBeGreaterThanOrEqual(originalParentPosition.x);
    expect(parentNode.position.y).toBeGreaterThanOrEqual(originalParentPosition.y);
  });
});
