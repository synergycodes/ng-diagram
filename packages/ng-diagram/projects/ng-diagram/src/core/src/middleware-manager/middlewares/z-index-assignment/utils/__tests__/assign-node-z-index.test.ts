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

  it('assigns computedZIndex to a single node', () => {
    const node = baseNode('1');
    const nodesMap = new Map<string, Node>([['1', node]]);
    const result = assignNodeZIndex(node, nodesMap, 5);
    expect(result).toHaveLength(1);
    expect(result[0].computedZIndex).toBe(5);
    expect(result[0].id).toBe('1');
  });

  it('assigns computedZIndex recursively to group and its children', () => {
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

  it('uses zOrder if selected is true and node has zOrder above baseZIndex', () => {
    const node = baseNode('1', { zOrder: 42 });
    const nodesMap = new Map<string, Node>([['1', node]]);
    const result = assignNodeZIndex(node, nodesMap, 5, true);
    expect(result[0].computedZIndex).toBe(42);
  });

  it('falls back to computedZIndex if selected is true but no zOrder', () => {
    const node = baseNode('1');
    const nodesMap = new Map<string, Node>([['1', node]]);
    const result = assignNodeZIndex(node, nodesMap, 7, true);
    expect(result[0].computedZIndex).toBe(7);
  });

  it('allows negative zOrder on ungrouped node when selected', () => {
    const node = baseNode('1', { zOrder: -5 });
    const nodesMap = new Map<string, Node>([['1', node]]);
    const result = assignNodeZIndex(node, nodesMap, 3, true);
    expect(result[0].computedZIndex).toBe(-5);
  });

  it('clamps negative zOrder on grouped child to baseZIndex when selected', () => {
    const group = baseNode('g', { isGroup: true });
    const child = baseNode('c', { groupId: 'g', zOrder: -5 });
    const nodesMap = new Map([
      ['g', group],
      ['c', child],
    ]);
    const result = assignNodeZIndex(child, nodesMap, 3, true);
    expect(result[0].computedZIndex).toBe(3);
  });

  it('clamps negative zOrder on child to group-relative baseZIndex when selected', () => {
    const group = baseNode('g', { isGroup: true });
    const child = baseNode('c', { groupId: 'g', zOrder: -10 });
    const nodesMap = new Map([
      ['g', group],
      ['c', child],
    ]);
    // baseZIndex for group is 5, child gets 6
    const result = assignNodeZIndex(group, nodesMap, 5, true);
    const groupResult = result.find((n) => n.id === 'g')!;
    const childResult = result.find((n) => n.id === 'c')!;
    expect(childResult.computedZIndex).toBeGreaterThan(groupResult.computedZIndex!);
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
    // computedZIndex should increase for each node
    expect(result[0].computedZIndex).toBe(0);
    expect(result[1].computedZIndex ?? 0).toBeGreaterThan(result[0].computedZIndex ?? 0);
    expect(result[2].computedZIndex ?? 0).toBeGreaterThan(result[1].computedZIndex ?? 0);
  });
});
