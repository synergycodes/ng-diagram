/**
 * Integration test for NGD-320: deleteNodes([groupId]) must cascade to the
 * group's descendants (matching deleteSelection). Without the cascade, children
 * keep a dangling groupId pointing at the deleted parent — and because a
 * missing parent counts as visible, previously hidden children reappear as
 * orphans on the computedHidden re-stamp.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { FlowCore } from '../../../flow-core';
import { createInMemoryModelAdapter, createTestFlowCore } from '../../../test-utils';
import type { ModelAdapter } from '../../../types';

describe('deleteNodes group cascade (integration)', () => {
  let model: ModelAdapter;
  let flowCore: FlowCore;

  afterEach(() => {
    flowCore.destroy();
  });

  const setupHiddenGroupWithChildren = async () => {
    model = createInMemoryModelAdapter();
    flowCore = createTestFlowCore(model);

    await flowCore.commandHandler.emit('addNodes', {
      nodes: [
        { id: 'group', isGroup: true, hidden: true, selected: false, position: { x: 0, y: 0 }, data: {} },
        { id: 'child', groupId: 'group', selected: false, position: { x: 10, y: 10 }, data: {} },
        { id: 'grandchild', groupId: 'child', selected: false, position: { x: 20, y: 20 }, data: {} },
        { id: 'outsider', selected: false, position: { x: 100, y: 100 }, data: {} },
      ],
    });
    await flowCore.commandHandler.emit('addEdges', {
      edges: [{ id: 'child-to-outsider', source: 'child', target: 'outsider', selected: false, data: {} }],
    });

    // Sanity: visibility is inherited, so the children start effectively hidden.
    expect(model.getNodes().find((node) => node.id === 'child')?.computedHidden).toBe(true);
    expect(model.getNodes().find((node) => node.id === 'grandchild')?.computedHidden).toBe(true);
  };

  it('should delete the whole subtree of a hidden group, leaving no orphans', async () => {
    await setupHiddenGroupWithChildren();

    await flowCore.commandHandler.emit('deleteNodes', { ids: ['group'] });

    const remainingNodes = model.getNodes();
    expect(remainingNodes.map((node) => node.id)).toEqual(['outsider']);
    // No dangling groupId anywhere — every surviving node's parent must exist.
    const remainingIds = new Set(remainingNodes.map((node) => node.id));
    for (const node of remainingNodes) {
      if (node.groupId !== undefined) {
        expect(remainingIds.has(node.groupId)).toBe(true);
      }
    }
    // No orphan reappearance: nothing previously hidden is now visible.
    expect(remainingNodes.some((node) => node.id !== 'outsider')).toBe(false);
    // Edges into the deleted subtree must not dangle.
    expect(model.getEdges()).toEqual([]);
  });

  it('should keep a subtree deletion consistent when the group and a child are both passed', async () => {
    await setupHiddenGroupWithChildren();

    await flowCore.commandHandler.emit('deleteNodes', { ids: ['group', 'grandchild'] });

    expect(model.getNodes().map((node) => node.id)).toEqual(['outsider']);
    expect(model.getEdges()).toEqual([]);
  });
});
