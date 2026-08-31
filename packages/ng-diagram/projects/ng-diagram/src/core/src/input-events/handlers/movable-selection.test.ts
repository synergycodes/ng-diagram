import { describe, expect, it, vi } from 'vitest';
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

  /** Minimal flow mock: resolves descendants from the given nodes' groupId links. */
  const createFlow = (selectedWithChildren: Node[]): FlowCore => {
    const getAllDescendantIds = (rootId: string): string[] => {
      const result: string[] = [];
      const queue = [rootId];
      while (queue.length) {
        const current = queue.shift()!;
        for (const node of selectedWithChildren) {
          if (node.groupId === current) {
            result.push(node.id);
            queue.push(node.id);
          }
        }
      }
      return result;
    };

    return {
      modelLookup: {
        getSelectedNodesWithChildren: () => selectedWithChildren,
        getAllDescendantIds,
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

  it('should move hidden descendants reached through a non-group parent link without integrity errors', () => {
    // Model-integrity edge case: a child whose groupId points at a plain node.
    // Effective visibility and the selection expansion both follow raw groupId
    // links, so the movable set must too — previously this path went through
    // getParentChain, which enforces isGroup and console.errors per frame.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const group = createNode('group', { selected: true, isGroup: true } as Partial<Node>);
    const plainMiddle = createNode('middle', { groupId: 'group' });
    const hiddenLeaf = createNode('leaf', { groupId: 'middle', computedHidden: true });

    expect(getMovableSelection(createFlow([group, plainMiddle, hiddenLeaf]))).toEqual([group, plainMiddle, hiddenLeaf]);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should include a hidden selected node that is also a descendant of a visible selected group', () => {
    const group = createNode('group', { selected: true, isGroup: true } as Partial<Node>);
    const hiddenSelectedChild = createNode('child', { selected: true, groupId: 'group', computedHidden: true });

    expect(getMovableSelection(createFlow([group, hiddenSelectedChild]))).toEqual([group, hiddenSelectedChild]);
  });
});
