/**
 * deleteNodes removes the whole subtree of every deleted node, matching
 * deleteSelection: no surviving node may keep a groupId that points at a
 * deleted node, and content that was effectively hidden before the delete
 * must not become visible because its parent disappeared.
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

  const nodeIds = () =>
    model
      .getNodes()
      .map((node) => node.id)
      .sort();
  const edgeIds = () =>
    model
      .getEdges()
      .map((edge) => edge.id)
      .sort();
  const isHidden = (id: string) => model.getNodes().find((node) => node.id === id)?.computedHidden;

  // Two hidden groups: `group` is deleted, `keeper` survives and proves the
  // cascade stops at the deleted subtree.
  const setupTwoHiddenGroups = async () => {
    model = createInMemoryModelAdapter();
    flowCore = createTestFlowCore(model);

    await flowCore.commandHandler.emit('addNodes', {
      nodes: [
        { id: 'group', isGroup: true, hidden: true, selected: false, position: { x: 0, y: 0 }, data: {} },
        { id: 'child', groupId: 'group', selected: false, position: { x: 10, y: 10 }, data: {} },
        { id: 'grandchild', groupId: 'child', selected: false, position: { x: 20, y: 20 }, data: {} },
        { id: 'keeper', isGroup: true, hidden: true, selected: false, position: { x: 200, y: 0 }, data: {} },
        { id: 'keeperChild', groupId: 'keeper', selected: false, position: { x: 210, y: 10 }, data: {} },
        { id: 'outsider', selected: false, position: { x: 100, y: 100 }, data: {} },
      ],
    });
    await flowCore.commandHandler.emit('addEdges', {
      edges: [
        { id: 'child-to-outsider', source: 'child', target: 'outsider', selected: false, data: {} },
        { id: 'child-to-keeperChild', source: 'child', target: 'keeperChild', selected: false, data: {} },
        { id: 'keeperChild-to-outsider', source: 'keeperChild', target: 'outsider', selected: false, data: {} },
      ],
    });

    // Visibility is inherited, so every child starts effectively hidden.
    expect(isHidden('child')).toBe(true);
    expect(isHidden('grandchild')).toBe(true);
    expect(isHidden('keeperChild')).toBe(true);
  };

  const expectOnlyKeeperSubtreeAndOutsiderLeft = () => {
    const remainingNodes = model.getNodes();
    expect(nodeIds()).toEqual(['keeper', 'keeperChild', 'outsider']);
    // Every surviving groupId still points at a surviving node.
    const remainingIds = new Set(remainingNodes.map((node) => node.id));
    for (const node of remainingNodes) {
      if (node.groupId !== undefined) {
        expect(remainingIds.has(node.groupId)).toBe(true);
      }
    }
    // Hidden content outside the deleted subtree stays hidden.
    expect(isHidden('keeperChild')).toBe(true);
    // Only edges with both endpoints surviving remain.
    expect(edgeIds()).toEqual(['keeperChild-to-outsider']);
  };

  it('should delete the whole subtree of a hidden group and nothing else', async () => {
    await setupTwoHiddenGroups();

    await flowCore.commandHandler.emit('deleteNodes', { ids: ['group'] });

    expectOnlyKeeperSubtreeAndOutsiderLeft();
  });

  it('should delete the same subtree when the group and one of its descendants are both passed', async () => {
    await setupTwoHiddenGroups();

    await flowCore.commandHandler.emit('deleteNodes', { ids: ['group', 'grandchild'] });

    expectOnlyKeeperSubtreeAndOutsiderLeft();
  });
});
