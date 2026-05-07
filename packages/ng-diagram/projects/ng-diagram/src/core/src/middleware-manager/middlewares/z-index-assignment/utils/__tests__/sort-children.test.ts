import { describe, expect, it } from 'vitest';
import type { Node } from '../../../../../types';
import { collectIdsInHierarchyOrder, sortChildren } from '../sort-children';

const makeNode = (id: string, extra: Partial<Node> = {}): Node => ({
  id,
  type: 'node',
  position: { x: 0, y: 0 },
  data: {},
  ...extra,
});

describe('sortChildren', () => {
  it('should sort by zOrder ascending', () => {
    // Reverse order in array to prove sorting works
    const children = [makeNode('c3', { zOrder: 10 }), makeNode('c1', { zOrder: -1 }), makeNode('c2', { zOrder: 3 })];

    const result = sortChildren(children);

    expect(result.map((n) => n.id)).toEqual(['c1', 'c2', 'c3']);
  });

  it('should treat missing zOrder as 0', () => {
    const children = [makeNode('c2', { zOrder: 1 }), makeNode('c1')];

    const result = sortChildren(children);

    expect(result.map((n) => n.id)).toEqual(['c1', 'c2']);
  });

  it('should sort selected nodes after non-selected', () => {
    // Selected node first in array to prove sort moves it last
    const children = [makeNode('sel', { selected: true }), makeNode('nosel', { selected: false })];

    const result = sortChildren(children);

    expect(result.map((n) => n.id)).toEqual(['nosel', 'sel']);
  });

  it('should sort by zOrder within same selection status', () => {
    const children = [
      makeNode('sel2', { selected: true, zOrder: 5 }),
      makeNode('sel1', { selected: true, zOrder: 1 }),
      makeNode('nosel2', { selected: false, zOrder: 3 }),
      makeNode('nosel1', { selected: false, zOrder: -1 }),
    ];

    const result = sortChildren(children);

    expect(result.map((n) => n.id)).toEqual(['nosel1', 'nosel2', 'sel1', 'sel2']);
  });

  it('should ignore selection when ignoreSelection is true', () => {
    const children = [
      makeNode('sel', { selected: true, zOrder: 1 }),
      makeNode('nosel', { selected: false, zOrder: 5 }),
    ];

    const result = sortChildren(children, true);

    // Sorted purely by zOrder: sel(1) before nosel(5)
    expect(result.map((n) => n.id)).toEqual(['sel', 'nosel']);
  });

  it('should not mutate the original array', () => {
    const children = [makeNode('b', { zOrder: 2 }), makeNode('a', { zOrder: 1 })];
    const original = [...children];

    sortChildren(children);

    expect(children.map((n) => n.id)).toEqual(original.map((n) => n.id));
  });

  it('should return empty array for empty input', () => {
    expect(sortChildren([])).toEqual([]);
  });
});

describe('collectIdsInHierarchyOrder', () => {
  it('should return single root node', () => {
    const nodesById = new Map([['r', makeNode('r')]]);
    const childrenByGroupId = new Map<string, Node[]>();

    const result = collectIdsInHierarchyOrder(['r'], nodesById, childrenByGroupId);

    expect(result).toEqual(['r']);
  });

  it('should return parent before children sorted by zOrder', () => {
    const nodesById = new Map([
      ['g', makeNode('g', { isGroup: true })],
      // Reverse zOrder in map to prove sorting
      ['c2', makeNode('c2', { groupId: 'g', zOrder: 5 })],
      ['c1', makeNode('c1', { groupId: 'g', zOrder: 1 })],
    ]);
    const childrenByGroupId = new Map([['g', [nodesById.get('c2')!, nodesById.get('c1')!]]]);

    const result = collectIdsInHierarchyOrder(['g'], nodesById, childrenByGroupId);

    expect(result).toEqual(['g', 'c1', 'c2']);
  });

  it('should sort selected children last by default', () => {
    const nodesById = new Map([
      ['g', makeNode('g', { isGroup: true })],
      ['sel', makeNode('sel', { groupId: 'g', selected: true })],
      ['nosel', makeNode('nosel', { groupId: 'g' })],
    ]);
    const childrenByGroupId = new Map([['g', [nodesById.get('sel')!, nodesById.get('nosel')!]]]);

    const result = collectIdsInHierarchyOrder(['g'], nodesById, childrenByGroupId);

    expect(result).toEqual(['g', 'nosel', 'sel']);
  });

  it('should ignore selection when ignoreSelection is true', () => {
    const nodesById = new Map([
      ['g', makeNode('g', { isGroup: true })],
      ['sel', makeNode('sel', { groupId: 'g', selected: true, zOrder: 1 })],
      ['nosel', makeNode('nosel', { groupId: 'g', zOrder: 5 })],
    ]);
    const childrenByGroupId = new Map([['g', [nodesById.get('nosel')!, nodesById.get('sel')!]]]);

    const result = collectIdsInHierarchyOrder(['g'], nodesById, childrenByGroupId, true);

    // Sorted by zOrder only: sel(1) before nosel(5)
    expect(result).toEqual(['g', 'sel', 'nosel']);
  });

  it('should recurse into nested groups in correct order', () => {
    const nodesById = new Map([
      ['g1', makeNode('g1', { isGroup: true })],
      ['g2', makeNode('g2', { isGroup: true, groupId: 'g1', zOrder: 5 })],
      ['c1', makeNode('c1', { groupId: 'g1', zOrder: 1 })],
      ['c2', makeNode('c2', { groupId: 'g2' })],
    ]);
    const childrenByGroupId = new Map<string, Node[]>([
      // g2 before c1 in array to prove sort reorders
      ['g1', [nodesById.get('g2')!, nodesById.get('c1')!]],
      ['g2', [nodesById.get('c2')!]],
    ]);

    const result = collectIdsInHierarchyOrder(['g1'], nodesById, childrenByGroupId);

    // c1(zOrder=1) before g2(zOrder=5), then g2's child c2
    expect(result).toEqual(['g1', 'c1', 'g2', 'c2']);
  });

  it('should handle multiple root IDs', () => {
    const nodesById = new Map([
      ['r1', makeNode('r1')],
      ['r2', makeNode('r2')],
    ]);
    const childrenByGroupId = new Map<string, Node[]>();

    const result = collectIdsInHierarchyOrder(['r1', 'r2'], nodesById, childrenByGroupId);

    expect(result).toEqual(['r1', 'r2']);
  });

  it('should skip missing nodes', () => {
    const nodesById = new Map([['r1', makeNode('r1')]]);
    const childrenByGroupId = new Map<string, Node[]>();

    const result = collectIdsInHierarchyOrder(['r1', 'missing'], nodesById, childrenByGroupId);

    expect(result).toEqual(['r1']);
  });
});
