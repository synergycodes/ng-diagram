import { describe, expect, it } from 'vitest';
import type { GroupNode, SimpleNode } from '../types/node.interface';
import { isGroup } from './is-group';

describe('isGroup', () => {
  it('returns true for a group node', () => {
    const node: GroupNode = {
      id: 'group-1',
      position: { x: 0, y: 0 },
      data: {},
      isGroup: true,
      highlighted: false,
    };

    expect(isGroup(node)).toBe(true);
  });

  it('returns false for a plain node', () => {
    const node: SimpleNode = {
      id: 'node-1',
      position: { x: 0, y: 0 },
      data: {},
    };

    expect(isGroup(node)).toBe(false);
  });
});
