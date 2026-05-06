import { describe, expect, it } from 'vitest';
import type { Node, ZIndexConfig } from '../../../../../types';
import { assignNodeZIndex, computeNodeBaseZIndices } from '../assign-node-z-index';
import { createGroupChildrenMap } from '../create-group-children-map';

const makeNode = (id: string, extra: Partial<Node> = {}): Node => ({
  id,
  type: 'node',
  position: { x: 0, y: 0 },
  data: {},
  ...extra,
});

const zIndexConfig: ZIndexConfig = {
  enabled: true,
  selectedZIndex: 100,
  elevateOnSelection: true,
  edgesAboveConnectedNodes: false,
  temporaryEdgeZIndex: 100,
};

function buildMap(...nodes: Node[]): Map<string, Node> {
  return new Map(nodes.map((n) => [n.id, n]));
}

function cbg(nodesMap: Map<string, Node>): Map<string, Node[]> {
  return createGroupChildrenMap(nodesMap);
}

describe('assignNodeZIndex', () => {
  describe('basic z-index assignment', () => {
    it('should assign baseZIndex to a single node', () => {
      const node = makeNode('1');
      const { nodes } = assignNodeZIndex(node, cbg(buildMap(node)), 5);

      expect(nodes).toHaveLength(1);
      expect(nodes[0].computedZIndex).toBe(5);
    });

    it('should assign incrementing z-indices to group children', () => {
      const g = makeNode('g', { isGroup: true });
      const c1 = makeNode('c1', { groupId: 'g' });
      const c2 = makeNode('c2', { groupId: 'g' });
      const map = buildMap(g, c1, c2);

      const { nodes } = assignNodeZIndex(g, cbg(map), 0);

      expect(nodes.find((n) => n.id === 'g')!.computedZIndex).toBe(0);
      expect(nodes.find((n) => n.id === 'c1')!.computedZIndex).toBe(1);
      expect(nodes.find((n) => n.id === 'c2')!.computedZIndex).toBe(2);
    });

    it('should handle nested groups', () => {
      const g1 = makeNode('g1', { isGroup: true });
      const g2 = makeNode('g2', { isGroup: true, groupId: 'g1' });
      const c = makeNode('c', { groupId: 'g2' });
      const map = buildMap(g1, g2, c);

      const { nodes } = assignNodeZIndex(g1, cbg(map), 0);

      expect(nodes.find((n) => n.id === 'g1')!.computedZIndex).toBe(0);
      expect(nodes.find((n) => n.id === 'g2')!.computedZIndex).toBe(1);
      expect(nodes.find((n) => n.id === 'c')!.computedZIndex).toBe(2);
    });
  });

  describe('zOrder handling', () => {
    it('should use zOrder when it exceeds baseZIndex', () => {
      const node = makeNode('1', { zOrder: 42 });

      const { nodes } = assignNodeZIndex(node, cbg(buildMap(node)), 5);

      expect(nodes[0].computedZIndex).toBe(42);
    });

    it('should use baseZIndex when no zOrder is set', () => {
      const node = makeNode('1');

      const { nodes } = assignNodeZIndex(node, cbg(buildMap(node)), 7);

      expect(nodes[0].computedZIndex).toBe(7);
    });

    it('should allow negative zOrder on root/ungrouped node', () => {
      const node = makeNode('1', { zOrder: -5 });

      const { nodes } = assignNodeZIndex(node, cbg(buildMap(node)), 3);

      expect(nodes[0].computedZIndex).toBe(-5);
    });

    it('should clamp negative zOrder on grouped child to slot position', () => {
      const g = makeNode('g', { isGroup: true });
      const c = makeNode('c', { groupId: 'g', zOrder: -5 });
      const map = buildMap(g, c);

      const { nodes } = assignNodeZIndex(g, cbg(map), 0);

      // child slot = 1, Math.max(-5, 1) = 1
      expect(nodes.find((n) => n.id === 'c')!.computedZIndex).toBe(1);
    });

    it('should use child zOrder when it exceeds group floor', () => {
      const g = makeNode('g', { isGroup: true });
      const c = makeNode('c', { groupId: 'g', zOrder: 100 });
      const map = buildMap(g, c);

      const { nodes } = assignNodeZIndex(g, cbg(map), 5);

      expect(nodes.find((n) => n.id === 'c')!.computedZIndex).toBe(100);
    });

    it('should start children from group zOrder when it exceeds incremented base', () => {
      const g = makeNode('g', { isGroup: true, zOrder: 50 });
      const c1 = makeNode('c1', { groupId: 'g' });
      const c2 = makeNode('c2', { groupId: 'g' });
      const map = buildMap(g, c1, c2);

      const { nodes } = assignNodeZIndex(g, cbg(map), 3);

      expect(nodes.find((n) => n.id === 'g')!.computedZIndex).toBe(50);
      expect(nodes.find((n) => n.id === 'c1')!.computedZIndex).toBe(51);
      expect(nodes.find((n) => n.id === 'c2')!.computedZIndex).toBe(52);
    });
  });

  describe('independent child slots', () => {
    it('should not inflate next sibling when child has high zOrder', () => {
      const g = makeNode('g', { isGroup: true });
      // high-zOrder child listed first to prove sort handles it
      const c1 = makeNode('c1', { groupId: 'g', zOrder: 100 });
      const c2 = makeNode('c2', { groupId: 'g' });
      const map = buildMap(g, c1, c2);

      const { nodes } = assignNodeZIndex(g, cbg(map), 0);

      // Sorted: c2(0) slot 1, c1(100) slot 2 → max(100,2)=100
      expect(nodes.find((n) => n.id === 'c2')!.computedZIndex).toBe(1);
      expect(nodes.find((n) => n.id === 'c1')!.computedZIndex).toBe(100);
    });

    it('should not inflate parent-level siblings from deeply nested zOrder jump', () => {
      const g1 = makeNode('g1', { isGroup: true });
      const g2 = makeNode('g2', { isGroup: true, groupId: 'g1' });
      const deep = makeNode('deep', { groupId: 'g2', zOrder: 500 });
      const sibling = makeNode('sibling', { groupId: 'g1' });
      const map = buildMap(g1, g2, deep, sibling);

      const { nodes } = assignNodeZIndex(g1, cbg(map), 0);

      // g2 gets slot 1, sibling gets slot 2 — regardless of deep's zOrder=500
      expect(nodes.find((n) => n.id === 'sibling')!.computedZIndex).toBe(2);
      expect(nodes.find((n) => n.id === 'deep')!.computedZIndex).toBe(500);
    });

    it('should not produce duplicate z-indices for siblings when one has high zOrder', () => {
      const g = makeNode('g', { isGroup: true });
      const c1 = makeNode('c1', { groupId: 'g' });
      const c2 = makeNode('c2', { groupId: 'g', zOrder: 2 });
      const map = buildMap(g, c1, c2);

      const { nodes } = assignNodeZIndex(g, cbg(map), 0);

      const c1Z = nodes.find((n) => n.id === 'c1')!.computedZIndex!;
      const c2Z = nodes.find((n) => n.id === 'c2')!.computedZIndex!;
      expect(c1Z).not.toBe(c2Z);
    });
  });

  describe('selection-aware sorting', () => {
    it('should sort selected children after non-selected', () => {
      const g = makeNode('g', { isGroup: true });
      // selected child listed first in map to prove sort reorders
      const sel = makeNode('sel', { groupId: 'g', selected: true });
      const nosel = makeNode('nosel', { groupId: 'g' });
      const map = buildMap(g, sel, nosel);

      const { nodes } = assignNodeZIndex(g, cbg(map), 0);

      expect(nodes.find((n) => n.id === 'sel')!.computedZIndex).toBeGreaterThan(
        nodes.find((n) => n.id === 'nosel')!.computedZIndex!
      );
    });

    it('should sort by zOrder among selected siblings', () => {
      const g = makeNode('g', { isGroup: true });
      // higher zOrder listed first
      const sel2 = makeNode('sel2', { groupId: 'g', selected: true, zOrder: 10 });
      const sel1 = makeNode('sel1', { groupId: 'g', selected: true, zOrder: 1 });
      const map = buildMap(g, sel2, sel1);

      const { nodes } = assignNodeZIndex(g, cbg(map), 0);

      expect(nodes.find((n) => n.id === 'sel2')!.computedZIndex).toBeGreaterThan(
        nodes.find((n) => n.id === 'sel1')!.computedZIndex!
      );
    });

    it('should sort by zOrder among non-selected siblings', () => {
      const g = makeNode('g', { isGroup: true });
      // higher zOrder listed first
      const c2 = makeNode('c2', { groupId: 'g', zOrder: 5 });
      const c1 = makeNode('c1', { groupId: 'g', zOrder: 1 });
      const map = buildMap(g, c2, c1);

      const { nodes } = assignNodeZIndex(g, cbg(map), 0);

      expect(nodes.find((n) => n.id === 'c2')!.computedZIndex).toBeGreaterThan(
        nodes.find((n) => n.id === 'c1')!.computedZIndex!
      );
    });

    it('should place selected child above bringToFront sibling', () => {
      const g = makeNode('g', { isGroup: true });
      const btf = makeNode('btf', { groupId: 'g', zOrder: 5 });
      const sel = makeNode('sel', { groupId: 'g', selected: true });
      const map = buildMap(g, btf, sel);

      const { nodes } = assignNodeZIndex(g, cbg(map), 0, zIndexConfig);

      // sel sorted last (selected), then elevated
      expect(nodes.find((n) => n.id === 'sel')!.computedZIndex).toBeGreaterThan(
        nodes.find((n) => n.id === 'btf')!.computedZIndex!
      );
    });
  });

  describe('elevation', () => {
    it('should elevate selected root node', () => {
      const node = makeNode('1', { selected: true });

      const { nodes } = assignNodeZIndex(node, cbg(buildMap(node)), 0, zIndexConfig);

      expect(nodes[0].computedZIndex).toBe(100);
    });

    it('should not elevate non-selected node', () => {
      const node = makeNode('1');

      const { nodes } = assignNodeZIndex(node, cbg(buildMap(node)), 0, zIndexConfig);

      expect(nodes[0].computedZIndex).toBe(0);
    });

    it('should not elevate when elevateOnSelection is false', () => {
      const node = makeNode('1', { selected: true });

      const { nodes } = assignNodeZIndex(node, cbg(buildMap(node)), 0, {
        ...zIndexConfig,
        elevateOnSelection: false,
      });

      expect(nodes[0].computedZIndex).toBe(0);
    });

    it('should elevate selected group and propagate to children', () => {
      const g = makeNode('g', { isGroup: true, selected: true });
      const c = makeNode('c', { groupId: 'g' });
      const map = buildMap(g, c);

      const { nodes } = assignNodeZIndex(g, cbg(map), 0, zIndexConfig);

      expect(nodes.find((n) => n.id === 'g')!.computedZIndex).toBe(100);
      expect(nodes.find((n) => n.id === 'c')!.computedZIndex).toBe(101);
    });

    it('should apply cumulative elevation when parent and child are both selected', () => {
      const g = makeNode('g', { isGroup: true, selected: true });
      const c = makeNode('c', { groupId: 'g', selected: true });
      const map = buildMap(g, c);

      const { nodes } = assignNodeZIndex(g, cbg(map), 0, zIndexConfig);

      // group: +100 → 100. child: slot 1 + 200 (100 from parent + 100 own) → 201
      expect(nodes.find((n) => n.id === 'g')!.computedZIndex).toBe(100);
      expect(nodes.find((n) => n.id === 'c')!.computedZIndex).toBe(201);
    });

    it('should only elevate selected child inside non-selected group', () => {
      const g = makeNode('g', { isGroup: true });
      // selected child listed first to prove sort reorders
      const sel = makeNode('sel', { groupId: 'g', selected: true });
      const nosel = makeNode('nosel', { groupId: 'g' });
      const map = buildMap(g, sel, nosel);

      const { nodes } = assignNodeZIndex(g, cbg(map), 0, zIndexConfig);

      expect(nodes.find((n) => n.id === 'g')!.computedZIndex).toBe(0);
      expect(nodes.find((n) => n.id === 'nosel')!.computedZIndex).toBe(1);
      // sel sorted last (slot 2) + elevation 100 = 102
      expect(nodes.find((n) => n.id === 'sel')!.computedZIndex).toBe(102);
    });

    it('should add elevation on top of zOrder', () => {
      const node = makeNode('1', { selected: true, zOrder: 10 });

      const { nodes } = assignNodeZIndex(node, cbg(buildMap(node)), 0, zIndexConfig);

      expect(nodes[0].computedZIndex).toBe(110);
    });

    it('should not inflate sibling range from elevated child', () => {
      const g = makeNode('g', { isGroup: true });
      const c1 = makeNode('c1', { groupId: 'g', selected: true });
      const c2 = makeNode('c2', { groupId: 'g' });
      const map = buildMap(g, c1, c2);

      const { nodes } = assignNodeZIndex(g, cbg(map), 0, zIndexConfig);

      // c2 sorted first (not selected, slot 1), c1 sorted last (selected, slot 2 + 100 = 102)
      // c2 should be at 1, NOT inflated by c1's elevation
      expect(nodes.find((n) => n.id === 'c2')!.computedZIndex).toBe(1);
    });
  });

  describe('elevation tracking', () => {
    it('should track zero elevation for non-elevated nodes', () => {
      const node = makeNode('1');

      const { elevations } = assignNodeZIndex(node, cbg(buildMap(node)), 0, zIndexConfig);

      expect(elevations.get('1')).toBe(0);
    });

    it('should track selectedZIndex elevation for selected node', () => {
      const node = makeNode('1', { selected: true });

      const { elevations } = assignNodeZIndex(node, cbg(buildMap(node)), 0, zIndexConfig);

      expect(elevations.get('1')).toBe(100);
    });

    it('should track cumulative elevation through hierarchy', () => {
      const g = makeNode('g', { isGroup: true, selected: true });
      const c = makeNode('c', { groupId: 'g', selected: true });
      const map = buildMap(g, c);

      const { elevations } = assignNodeZIndex(g, cbg(map), 0, zIndexConfig);

      expect(elevations.get('g')).toBe(100);
      expect(elevations.get('c')).toBe(200);
    });

    it('should inherit parent elevation for non-selected child of selected group', () => {
      const g = makeNode('g', { isGroup: true, selected: true });
      const c = makeNode('c', { groupId: 'g' });
      const map = buildMap(g, c);

      const { elevations } = assignNodeZIndex(g, cbg(map), 0, zIndexConfig);

      expect(elevations.get('g')).toBe(100);
      expect(elevations.get('c')).toBe(100);
    });

    it('should track zero elevation when config not provided', () => {
      const node = makeNode('1', { selected: true });

      const { elevations } = assignNodeZIndex(node, cbg(buildMap(node)), 0);

      expect(elevations.get('1')).toBe(0);
    });
  });
});

describe('computeNodeBaseZIndices', () => {
  it('should compute base z-index for single node', () => {
    const node = makeNode('1', { zOrder: 5 });

    const result = computeNodeBaseZIndices(node, cbg(buildMap(node)), 0);

    expect(result.get('1')).toBe(5);
  });

  it('should compute hierarchy z-indices without elevation', () => {
    const g = makeNode('g', { isGroup: true, selected: true });
    const c = makeNode('c', { groupId: 'g', selected: true });
    const map = buildMap(g, c);

    const result = computeNodeBaseZIndices(g, cbg(map), 0, zIndexConfig);

    // No elevation despite selected + config
    expect(result.get('g')).toBe(0);
    expect(result.get('c')).toBe(1);
  });

  it('should sort by zOrder only, ignoring selection', () => {
    const g = makeNode('g', { isGroup: true });
    // selected node with lower zOrder listed first
    const sel = makeNode('sel', { groupId: 'g', selected: true, zOrder: 1 });
    const nosel = makeNode('nosel', { groupId: 'g', zOrder: 5 });
    const map = buildMap(g, sel, nosel);

    const result = computeNodeBaseZIndices(g, cbg(map), 0, zIndexConfig);

    // Sorted by zOrder only: sel(1) before nosel(5)
    expect(result.get('sel')).toBe(1);
    expect(result.get('nosel')).toBe(5);
  });

  it('should clamp negative zOrder on grouped child', () => {
    const g = makeNode('g', { isGroup: true });
    const c = makeNode('c', { groupId: 'g', zOrder: -5 });
    const map = buildMap(g, c);

    const result = computeNodeBaseZIndices(g, cbg(map), 0);

    expect(result.get('c')).toBe(1);
  });

  it('should allow negative zOrder on root node', () => {
    const node = makeNode('1', { zOrder: -5 });

    const result = computeNodeBaseZIndices(node, cbg(buildMap(node)), 0);

    expect(result.get('1')).toBe(-5);
  });

  it('should not inflate siblings from high zOrder child', () => {
    const g = makeNode('g', { isGroup: true });
    const c1 = makeNode('c1', { groupId: 'g', zOrder: 100 });
    const c2 = makeNode('c2', { groupId: 'g' });
    const map = buildMap(g, c1, c2);

    const result = computeNodeBaseZIndices(g, cbg(map), 0);

    expect(result.get('c2')).toBe(1);
    expect(result.get('c1')).toBe(100);
  });
});
