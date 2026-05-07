import { describe, expect, it } from 'vitest';
import type { Node } from '../../../../../types';
import { createGroupChildrenMap } from '../create-group-children-map';

const makeNode = (id: string, extra: Partial<Node> = {}): Node => ({
  id,
  type: 'node',
  position: { x: 0, y: 0 },
  data: {},
  ...extra,
});

describe('createGroupChildrenMap', () => {
  it('should return empty map when no nodes have groupId', () => {
    const nodesMap = new Map([
      ['1', makeNode('1')],
      ['2', makeNode('2')],
    ]);

    const result = createGroupChildrenMap(nodesMap);

    expect(result.size).toBe(0);
  });

  it('should group children by their groupId', () => {
    const nodesMap = new Map([
      ['g1', makeNode('g1', { isGroup: true })],
      ['c1', makeNode('c1', { groupId: 'g1' })],
      ['c2', makeNode('c2', { groupId: 'g1' })],
    ]);

    const result = createGroupChildrenMap(nodesMap);

    expect(
      result
        .get('g1')!
        .map((n) => n.id)
        .sort()
    ).toEqual(['c1', 'c2']);
  });

  it('should handle multiple groups', () => {
    const nodesMap = new Map([
      ['g1', makeNode('g1', { isGroup: true })],
      ['g2', makeNode('g2', { isGroup: true })],
      ['c1', makeNode('c1', { groupId: 'g1' })],
      ['c2', makeNode('c2', { groupId: 'g2' })],
      ['c3', makeNode('c3', { groupId: 'g1' })],
    ]);

    const result = createGroupChildrenMap(nodesMap);

    expect(
      result
        .get('g1')!
        .map((n) => n.id)
        .sort()
    ).toEqual(['c1', 'c3']);
    expect(result.get('g2')!.map((n) => n.id)).toEqual(['c2']);
  });

  it('should not include root nodes (no groupId) in any group', () => {
    const nodesMap = new Map([
      ['root', makeNode('root')],
      ['g1', makeNode('g1', { isGroup: true })],
      ['c1', makeNode('c1', { groupId: 'g1' })],
    ]);

    const result = createGroupChildrenMap(nodesMap);

    const allChildren = [...result.values()].flat();
    expect(allChildren.find((n) => n.id === 'root')).toBeUndefined();
  });

  it('should not create entry for groups with no children', () => {
    const nodesMap = new Map([['g1', makeNode('g1', { isGroup: true })]]);

    const result = createGroupChildrenMap(nodesMap);

    expect(result.has('g1')).toBe(false);
  });

  it('should handle nested groups correctly', () => {
    const nodesMap = new Map([
      ['g1', makeNode('g1', { isGroup: true })],
      ['g2', makeNode('g2', { isGroup: true, groupId: 'g1' })],
      ['c1', makeNode('c1', { groupId: 'g2' })],
    ]);

    const result = createGroupChildrenMap(nodesMap);

    // g1's direct child is g2 (not c1)
    expect(result.get('g1')!.map((n) => n.id)).toEqual(['g2']);
    // g2's direct child is c1
    expect(result.get('g2')!.map((n) => n.id)).toEqual(['c1']);
  });

  it('should return empty map for empty input', () => {
    const result = createGroupChildrenMap(new Map());

    expect(result.size).toBe(0);
  });
});
