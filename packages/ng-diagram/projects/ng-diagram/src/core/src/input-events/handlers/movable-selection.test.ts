import { describe, expect, it } from 'vitest';
import { FlowCore } from '../../flow-core';
import type { Node } from '../../types';
import { getMovableSelection } from './movable-selection';

describe('getMovableSelection', () => {
  const createNode = (id: string, overrides: Partial<Node> = {}): Node => ({
    id,
    position: { x: 0, y: 0 },
    data: {},
    ...overrides,
  });

  /** Minimal flow mock: resolves parent chains from the given nodes' groupId links. */
  const createFlow = (selectedWithChildren: Node[]): FlowCore => {
    const byId = new Map(selectedWithChildren.map((node) => [node.id, node]));
    const getParentChain = (nodeId: string): Node[] => {
      const chain: Node[] = [];
      let current = byId.get(nodeId);
      while (current?.groupId) {
        const parent = byId.get(current.groupId);
        if (!parent) break;
        chain.push(parent);
        current = parent;
      }
      return chain;
    };

    return {
      modelLookup: {
        getSelectedNodesWithChildren: () => selectedWithChildren,
        getParentChain,
      },
    } as unknown as FlowCore;
  };

  it('should include visible selected nodes', () => {
    const node = createNode('a', { selected: true });

    expect(getMovableSelection(createFlow([node]))).toEqual([node]);
  });

  it('should exclude effectively hidden selected nodes', () => {
    const hidden = createNode('a', { selected: true, computedHidden: true });
    const visible = createNode('b', { selected: true });

    expect(getMovableSelection(createFlow([hidden, visible]))).toEqual([visible]);
  });

  it('should include hidden descendants of a visible selected group', () => {
    const group = createNode('group', { selected: true, isGroup: true } as Partial<Node>);
    const hiddenChild = createNode('child', { groupId: 'group', computedHidden: true });
    const hiddenGrandchild = createNode('grandchild', { groupId: 'child', computedHidden: true });

    expect(getMovableSelection(createFlow([group, hiddenChild, hiddenGrandchild]))).toEqual([
      group,
      hiddenChild,
      hiddenGrandchild,
    ]);
  });

  it('should exclude hidden descendants of a hidden selected group', () => {
    const hiddenGroup = createNode('group', { selected: true, isGroup: true, computedHidden: true } as Partial<Node>);
    const hiddenChild = createNode('child', { groupId: 'group', computedHidden: true });

    expect(getMovableSelection(createFlow([hiddenGroup, hiddenChild]))).toEqual([]);
  });

  it('should exclude hidden descendants when their visible selected ancestor is not draggable', () => {
    const group = createNode('group', { selected: true, isGroup: true, draggable: false } as Partial<Node>);
    const hiddenChild = createNode('child', { groupId: 'group', computedHidden: true });

    expect(getMovableSelection(createFlow([group, hiddenChild]))).toEqual([]);
  });

  it('should exclude non-draggable nodes', () => {
    const node = createNode('a', { selected: true, draggable: false });

    expect(getMovableSelection(createFlow([node]))).toEqual([]);
  });

  it('should include a hidden selected node that is also a descendant of a visible selected group', () => {
    const group = createNode('group', { selected: true, isGroup: true } as Partial<Node>);
    const hiddenSelectedChild = createNode('child', { selected: true, groupId: 'group', computedHidden: true });

    expect(getMovableSelection(createFlow([group, hiddenSelectedChild]))).toEqual([group, hiddenSelectedChild]);
  });
});
