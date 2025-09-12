import { describe, expect, it } from 'vitest';
import type { Node } from '../../../../../types';
import { assignNodeZIndex } from '../assign-node-z-index';

describe('assignNodeZIndex', () => {
  const baseNode = (id: string, extra: Partial<Node> = {}): Node => ({
    id,
    type: 'node',
    position: { x: 0, y: 0 },
    data: {},
    ...extra,
  });

  it('assigns zIndex to a single node', () => {
    const node = baseNode('1');
    const nodesMap = new Map<string, Node>([['1', node]]);
    const result = assignNodeZIndex(node, nodesMap, 5);
    expect(result).toHaveLength(1);
    expect(result[0].computedZIndex).toBe(5);
    expect(result[0].id).toBe('1');
  });

  it('assigns zIndex recursively to group and its children', () => {
    const group = baseNode('g', { isGroup: true });
    const child1 = baseNode('c1', { groupId: 'g' });
    const child2 = baseNode('c2', { groupId: 'g' });
    const nodesMap = new Map([
      ['g', group],
      ['c1', child1],
      ['c2', child2],
    ]);
    const result = assignNodeZIndex(group, nodesMap, 1);
    // group, c1, c2
    expect(result.map((n) => n.id).sort()).toEqual(['g', 'c1', 'c2'].sort());
    expect(result[0].computedZIndex).toBe(1);
    expect(result[1].computedZIndex ?? 0).toBeGreaterThanOrEqual(2);
    expect(result[2].computedZIndex ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('uses zOrder if selected is true and node has zOrder', () => {
    const node = baseNode('1', { zOrder: 42 });
    const nodesMap = new Map<string, Node>([['1', node]]);
    const result = assignNodeZIndex(node, nodesMap, 5, true);
    expect(result[0].computedZIndex).toBe(42);
  });

  it('falls back to zIndex if selected is true but no zOrder', () => {
    const node = baseNode('1');
    const nodesMap = new Map<string, Node>([['1', node]]);
    const result = assignNodeZIndex(node, nodesMap, 7, true);
    expect(result[0].computedZIndex).toBe(7);
  });

  it('handles nested groups', () => {
    const group1 = baseNode('g1', { isGroup: true });
    const group2 = baseNode('g2', { isGroup: true, groupId: 'g1' });
    const child = baseNode('c', { groupId: 'g2' });
    const nodesMap = new Map<string, Node>([
      ['g1', group1],
      ['g2', group2],
      ['c', child],
    ]);
    const result = assignNodeZIndex(group1, nodesMap, 0);
    expect(result.map((n) => n.id).sort()).toEqual(['g1', 'g2', 'c'].sort());
    // zIndex should increase for each node
    expect(result[0].computedZIndex).toBe(0);
    expect(result[1].computedZIndex ?? 0).toBeGreaterThan(result[0].computedZIndex ?? 0);
    expect(result[2].computedZIndex ?? 0).toBeGreaterThan(result[1].computedZIndex ?? 0);
  });
});
