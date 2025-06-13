import { describe, expect, it } from 'vitest';
import { horizontalTreeLayout, verticalTreeLayout } from '../orientation-tree-layout.ts';
import { getMockTreeNode } from '../../test-utils.ts';
import { TreeLayoutConfig } from '../../types';

describe('verticalTreeLayout', () => {
  const config: TreeLayoutConfig = { siblingGap: 100, levelGap: 100, orientation: 'Vertical' };

  it('should layout single node correctly', () => {
    const root = getMockTreeNode('A', 100, 100);
    const endX = verticalTreeLayout(root, config, 0, 0);

    expect(root.position).toEqual({ x: 0, y: 0 });
    expect(endX).toBe(0);
  });

  it('should layout parent and children with proper gaps', () => {
    const root = getMockTreeNode('A', 100, 100);
    const child1 = getMockTreeNode('B', 100, 100);
    const child2 = getMockTreeNode('C', 100, 100);

    root.children = [child1, child2];

    const endX = verticalTreeLayout(root, config, 0, 0);

    expect(child1.position.y).toBeGreaterThan(root.position.y);
    expect(child2.position.y).toBeGreaterThan(root.position.y);

    expect(child2.position.x - child1.position.x).toBeGreaterThanOrEqual(child1.size!.width + config.siblingGap);

    const centerChildren = (child1.position.x + child2.position.x + child2.size!.width) / 2;
    const rootCenter = root.position.x + root.size!.width / 2;
    expect(Math.abs(centerChildren - rootCenter)).toBeLessThan(1);

    expect(endX).toBe(child2.position.x + child2.size!.width);
  });
});

describe('horizontalTreeLayout', () => {
  const config: TreeLayoutConfig = { siblingGap: 100, levelGap: 100, orientation: 'Horizontal' };

  it('should layout single node correctly', () => {
    const root = getMockTreeNode('A', 100, 100);
    const endY = horizontalTreeLayout(root, config, 0, 0);

    expect(root.position).toEqual({ x: 0, y: 0 });
    expect(endY).toBe(0);
  });

  it('should layout parent and children with proper gaps', () => {
    const root = getMockTreeNode('A', 100, 100);
    const child1 = getMockTreeNode('B', 100, 100);
    const child2 = getMockTreeNode('C', 100, 100);

    root.children = [child1, child2];

    const endY = horizontalTreeLayout(root, config, 0, 0);

    expect(child1.position.x).toBeGreaterThan(root.position.x);
    expect(child2.position.x).toBeGreaterThan(root.position.x);

    expect(child2.position.y - child1.position.y).toBeGreaterThanOrEqual(child1.size!.height + config.siblingGap);

    const centerChildren = (child1.position.y + child2.position.y + child2.size!.height) / 2;
    const rootCenter = root.position.y + root.size!.height / 2;
    expect(Math.abs(centerChildren - rootCenter)).toBeLessThan(1);

    expect(endY).toBe(child2.position.y + child2.size!.height);
  });
});
