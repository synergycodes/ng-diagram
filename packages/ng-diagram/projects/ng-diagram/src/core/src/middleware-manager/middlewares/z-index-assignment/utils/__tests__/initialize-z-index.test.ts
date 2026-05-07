import { describe, expect, it } from 'vitest';
import type { Node, ZIndexConfig } from '../../../../../types';
import { initializeBaseZIndices, initializeZIndex } from '../initialize-z-index';

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

describe('initializeZIndex', () => {
  it('should return empty result for empty input', () => {
    const { nodes, elevations } = initializeZIndex(new Map());

    expect(nodes).toHaveLength(0);
    expect(elevations.size).toBe(0);
  });

  it('should assign computedZIndex 0 to root nodes', () => {
    const nodesMap = new Map([
      ['1', makeNode('1')],
      ['2', makeNode('2')],
    ]);

    const { nodes } = initializeZIndex(nodesMap);

    expect(nodes).toHaveLength(2);
    expect(nodes.find((n) => n.id === '1')!.computedZIndex).toBe(0);
    expect(nodes.find((n) => n.id === '2')!.computedZIndex).toBe(0);
  });

  it('should assign incrementing z-indices to group children', () => {
    const nodesMap = new Map([
      ['g', makeNode('g', { isGroup: true })],
      ['c1', makeNode('c1', { groupId: 'g' })],
      ['c2', makeNode('c2', { groupId: 'g' })],
    ]);

    const { nodes } = initializeZIndex(nodesMap);

    expect(nodes.find((n) => n.id === 'g')!.computedZIndex).toBe(0);
    expect(nodes.find((n) => n.id === 'c1')!.computedZIndex).toBe(1);
    expect(nodes.find((n) => n.id === 'c2')!.computedZIndex).toBe(2);
  });

  it('should use zOrder on root node', () => {
    const nodesMap = new Map([['1', makeNode('1', { zOrder: 42 })]]);

    const { nodes } = initializeZIndex(nodesMap);

    expect(nodes[0].computedZIndex).toBe(42);
  });

  it('should allow negative zOrder on root node', () => {
    const nodesMap = new Map([['1', makeNode('1', { zOrder: -5 })]]);

    const { nodes } = initializeZIndex(nodesMap);

    expect(nodes[0].computedZIndex).toBe(-5);
  });

  it('should clamp negative zOrder on child to group floor', () => {
    const nodesMap = new Map([
      ['g', makeNode('g', { isGroup: true })],
      ['c', makeNode('c', { groupId: 'g', zOrder: -5 })],
    ]);

    const { nodes } = initializeZIndex(nodesMap);

    expect(nodes.find((n) => n.id === 'c')!.computedZIndex).toBe(1);
  });

  it('should use child zOrder when above group floor', () => {
    const nodesMap = new Map([
      ['g', makeNode('g', { isGroup: true })],
      ['c', makeNode('c', { groupId: 'g', zOrder: 50 })],
    ]);

    const { nodes } = initializeZIndex(nodesMap);

    expect(nodes.find((n) => n.id === 'c')!.computedZIndex).toBe(50);
  });

  it('should handle nested groups', () => {
    const nodesMap = new Map([
      ['g1', makeNode('g1', { isGroup: true })],
      ['g2', makeNode('g2', { isGroup: true, groupId: 'g1' })],
      ['c', makeNode('c', { groupId: 'g2' })],
    ]);

    const { nodes } = initializeZIndex(nodesMap);

    expect(nodes.find((n) => n.id === 'g1')!.computedZIndex).toBe(0);
    expect(nodes.find((n) => n.id === 'g2')!.computedZIndex).toBe(1);
    expect(nodes.find((n) => n.id === 'c')!.computedZIndex).toBe(2);
  });

  it('should not inflate sibling slots when child has high zOrder', () => {
    const nodesMap = new Map([
      ['g', makeNode('g', { isGroup: true })],
      // high-zOrder child listed first in map to test that sort, not insertion order, determines position
      ['c1', makeNode('c1', { groupId: 'g', zOrder: 100 })],
      ['c2', makeNode('c2', { groupId: 'g' })],
    ]);

    const { nodes } = initializeZIndex(nodesMap);

    // Sorted: c2(zOrder=0) gets slot 1, c1(zOrder=100) gets slot 2 → max(100, 2) = 100
    // c2 at 1, NOT at 101 (independent slots — c1's high zOrder doesn't inflate c2)
    const c1Z = nodes.find((n) => n.id === 'c1')!.computedZIndex!;
    const c2Z = nodes.find((n) => n.id === 'c2')!.computedZIndex!;
    expect(c1Z).toBe(100);
    expect(c2Z).toBe(1);
  });

  it('should use pre-built childrenByGroupId when provided', () => {
    const g = makeNode('g', { isGroup: true });
    const c = makeNode('c', { groupId: 'g' });
    const nodesMap = new Map([
      ['g', g],
      ['c', c],
    ]);
    const childrenByGroupId = new Map([['g', [c]]]);

    const { nodes } = initializeZIndex(nodesMap, undefined, childrenByGroupId);

    expect(nodes.find((n) => n.id === 'c')!.computedZIndex).toBe(1);
  });

  describe('with elevation', () => {
    it('should elevate selected root node', () => {
      const nodesMap = new Map([
        ['1', makeNode('1', { selected: true })],
        ['2', makeNode('2')],
      ]);

      const { nodes, elevations } = initializeZIndex(nodesMap, zIndexConfig);

      expect(nodes.find((n) => n.id === '1')!.computedZIndex).toBe(100);
      expect(nodes.find((n) => n.id === '2')!.computedZIndex).toBe(0);
      expect(elevations.get('1')).toBe(100);
      expect(elevations.get('2')).toBe(0);
    });

    it('should elevate selected group and its children', () => {
      const nodesMap = new Map([
        ['g', makeNode('g', { isGroup: true, selected: true })],
        ['c', makeNode('c', { groupId: 'g' })],
      ]);

      const { nodes, elevations } = initializeZIndex(nodesMap, zIndexConfig);

      // group gets +100, child inherits elevated base
      expect(nodes.find((n) => n.id === 'g')!.computedZIndex).toBe(100);
      expect(nodes.find((n) => n.id === 'c')!.computedZIndex).toBe(101);
      expect(elevations.get('g')).toBe(100);
      expect(elevations.get('c')).toBe(100);
    });

    it('should apply cumulative elevation when parent and child are both selected', () => {
      const nodesMap = new Map([
        ['g', makeNode('g', { isGroup: true, selected: true })],
        ['c', makeNode('c', { groupId: 'g', selected: true })],
      ]);

      const { nodes, elevations } = initializeZIndex(nodesMap, zIndexConfig);

      // group: +100. child: +100 (parent) + 100 (own) = +200
      expect(nodes.find((n) => n.id === 'g')!.computedZIndex).toBe(100);
      expect(nodes.find((n) => n.id === 'c')!.computedZIndex).toBe(201);
      expect(elevations.get('g')).toBe(100);
      expect(elevations.get('c')).toBe(200);
    });

    it('should only elevate selected child inside non-selected group', () => {
      const nodesMap = new Map([
        ['g', makeNode('g', { isGroup: true })],
        ['c1', makeNode('c1', { groupId: 'g', selected: true })],
        ['c2', makeNode('c2', { groupId: 'g' })],
      ]);

      const { nodes, elevations } = initializeZIndex(nodesMap, zIndexConfig);

      // c1 selected (sorted last), c2 not
      expect(elevations.get('g')).toBe(0);
      expect(elevations.get('c1')).toBe(100);
      expect(elevations.get('c2')).toBe(0);
      expect(nodes.find((n) => n.id === 'c1')!.computedZIndex).toBeGreaterThan(
        nodes.find((n) => n.id === 'c2')!.computedZIndex!
      );
    });

    it('should not elevate when elevateOnSelection is false', () => {
      const nodesMap = new Map([['1', makeNode('1', { selected: true })]]);

      const { nodes, elevations } = initializeZIndex(nodesMap, { ...zIndexConfig, elevateOnSelection: false });

      expect(nodes[0].computedZIndex).toBe(0);
      expect(elevations.get('1')).toBe(0);
    });
  });
});

describe('initializeBaseZIndices', () => {
  it('should return empty map for empty input', () => {
    const result = initializeBaseZIndices(new Map());

    expect(result.size).toBe(0);
  });

  it('should compute base z-indices for root nodes', () => {
    const nodesMap = new Map([
      ['1', makeNode('1')],
      ['2', makeNode('2', { zOrder: 5 })],
    ]);

    const result = initializeBaseZIndices(nodesMap);

    expect(result.get('1')).toBe(0);
    expect(result.get('2')).toBe(5);
  });

  it('should allow negative zOrder on root node', () => {
    const nodesMap = new Map([['1', makeNode('1', { zOrder: -5 })]]);

    const result = initializeBaseZIndices(nodesMap);

    expect(result.get('1')).toBe(-5);
  });

  it('should assign incrementing z-indices to group children', () => {
    const nodesMap = new Map([
      ['g', makeNode('g', { isGroup: true })],
      ['c1', makeNode('c1', { groupId: 'g' })],
      ['c2', makeNode('c2', { groupId: 'g' })],
    ]);

    const result = initializeBaseZIndices(nodesMap);

    expect(result.get('g')).toBe(0);
    expect(result.get('c1')).toBe(1);
    expect(result.get('c2')).toBe(2);
  });

  it('should use child zOrder when above group floor', () => {
    const nodesMap = new Map([
      ['g', makeNode('g', { isGroup: true })],
      ['c', makeNode('c', { groupId: 'g', zOrder: 10 })],
    ]);

    const result = initializeBaseZIndices(nodesMap);

    expect(result.get('c')).toBe(10);
  });

  it('should clamp negative zOrder on child to group floor', () => {
    const nodesMap = new Map([
      ['g', makeNode('g', { isGroup: true })],
      ['c', makeNode('c', { groupId: 'g', zOrder: -5 })],
    ]);

    const result = initializeBaseZIndices(nodesMap);

    expect(result.get('c')).toBe(1);
  });

  it('should handle nested groups', () => {
    const nodesMap = new Map([
      ['g1', makeNode('g1', { isGroup: true })],
      ['g2', makeNode('g2', { isGroup: true, groupId: 'g1' })],
      ['c', makeNode('c', { groupId: 'g2' })],
    ]);

    const result = initializeBaseZIndices(nodesMap);

    expect(result.get('g1')).toBe(0);
    expect(result.get('g2')).toBe(1);
    expect(result.get('c')).toBe(2);
  });

  it('should not inflate sibling slots when child has high zOrder', () => {
    const nodesMap = new Map([
      ['g', makeNode('g', { isGroup: true })],
      ['c1', makeNode('c1', { groupId: 'g', zOrder: 100 })],
      ['c2', makeNode('c2', { groupId: 'g' })],
    ]);

    const result = initializeBaseZIndices(nodesMap);

    // Sorted: c2(0) slot 1, c1(100) slot 2 → max(100,2)=100. c2 stays at 1
    expect(result.get('c1')).toBe(100);
    expect(result.get('c2')).toBe(1);
  });

  it('should sort children by zOrder regardless of map insertion order', () => {
    const nodesMap = new Map([
      ['g', makeNode('g', { isGroup: true })],
      // high zOrder listed first in map
      ['c2', makeNode('c2', { groupId: 'g', zOrder: 5 })],
      ['c1', makeNode('c1', { groupId: 'g', zOrder: 1 })],
    ]);

    const result = initializeBaseZIndices(nodesMap);

    // c1(zOrder=1) gets slot 1, c2(zOrder=5) gets slot 2 → max(5,2)=5
    expect(result.get('c1')).toBe(1);
    expect(result.get('c2')).toBe(5);
    expect(result.get('c2')!).toBeGreaterThan(result.get('c1')!);
  });

  it('should ignore selection — no elevation applied', () => {
    const nodesMap = new Map([
      ['g', makeNode('g', { isGroup: true, selected: true })],
      ['c', makeNode('c', { groupId: 'g', selected: true })],
    ]);

    const result = initializeBaseZIndices(nodesMap);

    expect(result.get('g')).toBe(0);
    expect(result.get('c')).toBe(1);
  });

  it('should ignore selection for sort order — sort by zOrder only', () => {
    const nodesMap = new Map([
      ['g', makeNode('g', { isGroup: true })],
      // selected node with lower zOrder listed first
      ['c1', makeNode('c1', { groupId: 'g', selected: true, zOrder: 1 })],
      ['c2', makeNode('c2', { groupId: 'g', zOrder: 5 })],
    ]);

    const result = initializeBaseZIndices(nodesMap);

    // Sorted by zOrder only (ignoring selection): c1(1) before c2(5)
    expect(result.get('c1')).toBe(1);
    expect(result.get('c2')).toBe(5);
  });

  it('should use pre-built childrenByGroupId when provided', () => {
    const g = makeNode('g', { isGroup: true });
    const c = makeNode('c', { groupId: 'g' });
    const nodesMap = new Map([
      ['g', g],
      ['c', c],
    ]);
    const childrenByGroupId = new Map([['g', [c]]]);

    const result = initializeBaseZIndices(nodesMap, childrenByGroupId);

    expect(result.get('c')).toBe(1);
  });
});
