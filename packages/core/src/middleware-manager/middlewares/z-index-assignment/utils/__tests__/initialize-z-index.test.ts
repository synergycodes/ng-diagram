import { describe, expect, it } from 'vitest';
import type { Node } from '../../../../../types';
import { initializeZIndex } from '../initialize-z-index';

const baseNode = (id: string, extra: Partial<Node> = {}): Node => ({
  id,
  type: 'node',
  position: { x: 0, y: 0 },
  data: {},
  ...extra,
});

describe('initializeZIndex', () => {
  it('assigns zIndex to root nodes', () => {
    const node1 = baseNode('1');
    const node2 = baseNode('2');
    const nodesMap = new Map<string, Node>([
      ['1', node1],
      ['2', node2],
    ]);
    const result = initializeZIndex(nodesMap);
    expect(result).toHaveLength(2);
    expect(result.find((n) => n.id === '1')?.computedZIndex).toBe(0);
    expect(result.find((n) => n.id === '2')?.computedZIndex).toBe(0);
  });

  it('assigns zIndex recursively to groups and children', () => {
    const group = baseNode('g', { isGroup: true });
    const child1 = baseNode('c1', { groupId: 'g' });
    const child2 = baseNode('c2', { groupId: 'g' });
    const nodesMap = new Map<string, Node>([
      ['g', group],
      ['c1', child1],
      ['c2', child2],
    ]);
    const result = initializeZIndex(nodesMap);
    expect(result.map((n) => n.id).sort()).toEqual(['g', 'c1', 'c2'].sort());
    expect(result.find((n) => n.id === 'g')?.computedZIndex).toBe(0);
    expect(result.find((n) => n.id === 'c1')?.computedZIndex).toBe(1);
    expect(result.find((n) => n.id === 'c2')?.computedZIndex).toBe(1);
  });

  it('uses zOrder if present', () => {
    const node = baseNode('1', { zOrder: 42 });
    const nodesMap = new Map<string, Node>([['1', node]]);
    const result = initializeZIndex(nodesMap);
    expect(result[0].computedZIndex).toBe(42);
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
    const result = initializeZIndex(nodesMap);
    expect(result.map((n) => n.id).sort()).toEqual(['g1', 'g2', 'c'].sort());
    expect(result.find((n) => n.id === 'g1')?.computedZIndex).toBe(0);
    expect(result.find((n) => n.id === 'g2')?.computedZIndex).toBe(1);
    expect(result.find((n) => n.id === 'c')?.computedZIndex).toBe(2);
  });
});
