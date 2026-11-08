import { describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../flow-core';
import type { Node } from '../../types';
import { getMovableSelection, movesOnPress } from './movable-selection';

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
    // links, so the movable set must too — and it must not spam integrity
    // errors per pointermove frame.
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

  it('should exclude visible and hidden descendants of a selected non-draggable group', () => {
    const group = createNode('group', { selected: true, isGroup: true, draggable: false } as Partial<Node>);
    const visibleChild = createNode('visible-child', { groupId: 'group' });
    const hiddenChild = createNode('hidden-child', { groupId: 'group', computedHidden: true });

    expect(getMovableSelection(createFlow([group, visibleChild, hiddenChild]))).toEqual([]);
  });

  it('should exclude visible descendants of a selected non-draggable group when nothing is hidden', () => {
    const group = createNode('group', { selected: true, isGroup: true, draggable: false } as Partial<Node>);
    const child = createNode('child', { groupId: 'group' });
    const grandchild = createNode('grandchild', { groupId: 'child' });

    expect(getMovableSelection(createFlow([group, child, grandchild]))).toEqual([]);
  });

  it('should keep the whole subtree of a non-draggable child group in place when its draggable parent moves', () => {
    const outer = createNode('outer', { selected: true, isGroup: true } as Partial<Node>);
    const inner = createNode('inner', { groupId: 'outer', isGroup: true, draggable: false } as Partial<Node>);
    const innerVisible = createNode('inner-visible', { groupId: 'inner' });
    const innerHidden = createNode('inner-hidden', { groupId: 'inner', computedHidden: true });
    const sibling = createNode('sibling', { groupId: 'outer' });

    expect(getMovableSelection(createFlow([outer, inner, innerVisible, innerHidden, sibling]))).toEqual([
      outer,
      sibling,
    ]);
  });

  it('should move a selected non-draggable child with its moving parent group', () => {
    const group = createNode('group', { selected: true, isGroup: true } as Partial<Node>);
    const lockedChild = createNode('locked-child', { selected: true, groupId: 'group', draggable: false });

    expect(getMovableSelection(createFlow([group, lockedChild]))).toEqual([group, lockedChild]);
  });

  it('should exclude selected descendants of a selected non-draggable group', () => {
    // Box selection and select all also select the children of the group.
    const group = createNode('group', { selected: true, isGroup: true, draggable: false } as Partial<Node>);
    const child = createNode('child', { selected: true, groupId: 'group' });

    expect(getMovableSelection(createFlow([group, child]))).toEqual([]);
  });

  // The freeze applies only when the non-draggable group takes part in the move: content inside a locked group stays draggable on its own.
  it('should include a selected child of a non-draggable group that is not part of the selection', () => {
    const child = createNode('child', { selected: true, groupId: 'locked-group' });

    expect(getMovableSelection(createFlow([child]))).toEqual([child]);
  });

  describe('movesOnPress', () => {
    it('should reject a press on a selected child of a selected non-draggable group', () => {
      const group = createNode('group', { selected: true, isGroup: true, draggable: false } as Partial<Node>);
      const child = createNode('child', { selected: true, groupId: 'group' });

      expect(movesOnPress(createFlow([group, child]), child)).toBe(false);
    });

    it('should accept a press on a selected non-draggable child of a selected draggable group', () => {
      const group = createNode('group', { selected: true, isGroup: true } as Partial<Node>);
      const child = createNode('child', { selected: true, groupId: 'group', draggable: false });

      expect(movesOnPress(createFlow([group, child]), child)).toBe(true);
    });

    it('should judge an unselected node by its own draggable flag', () => {
      const flow = createFlow([]);

      expect(movesOnPress(flow, createNode('a'))).toBe(true);
      expect(movesOnPress(flow, createNode('b', { draggable: false }))).toBe(false);
    });
  });
});
