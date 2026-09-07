import { expect, test } from './fixtures/diagram';

test.describe('clipboard', () => {
  test('copying a selected node and pasting adds a duplicate to the model', async ({ diagram }) => {
    await diagram.load();
    const before = (await diagram.model.nodes()).length;

    await diagram.selection.select(['node-a']);
    await diagram.clipboard.copy();
    await diagram.clipboard.paste({ x: 600, y: 400 });

    await expect.poll(async () => (await diagram.model.nodes()).length).toBe(before + 1);
  });

  test('cutting a node removes the original and re-adds it on paste', async ({ diagram }) => {
    await diagram.load();

    await diagram.selection.select(['node-c']);
    await diagram.clipboard.cut();

    await expect.poll(async () => (await diagram.model.nodes()).map((n) => n.id)).toEqual(['node-a', 'node-b']);

    await diagram.clipboard.paste({ x: 600, y: 400 });

    await expect.poll(async () => (await diagram.model.nodes()).length).toBe(3);
  });

  test('cutting a collapsed group carries its hidden children and internal wiring through the clipboard', async ({
    diagram,
  }) => {
    await diagram.load({
      model: {
        nodes: [
          {
            id: 'group',
            isGroup: true,
            position: { x: 100, y: 100 },
            size: { width: 360, height: 220 },
            autoSize: false,
            data: {},
          },
          { id: 'child-1', groupId: 'group', hidden: true, position: { x: 140, y: 160 }, data: { label: 'child 1' } },
          { id: 'child-2', groupId: 'group', hidden: true, position: { x: 300, y: 160 }, data: { label: 'child 2' } },
          { id: 'outside', position: { x: 700, y: 160 }, data: { label: 'outside' } },
        ],
        edges: [{ id: 'internal', source: 'child-1', target: 'child-2', data: {} }],
      },
    });

    await diagram.selection.select(['group']);
    await diagram.clipboard.cut();

    // The collapsed group leaves with its hidden children and their edge — nothing is orphaned.
    await expect.poll(async () => (await diagram.model.nodes()).map((n) => n.id)).toEqual(['outside']);
    expect(await diagram.model.edges()).toEqual([]);

    await diagram.clipboard.paste({ x: 600, y: 400 });

    await expect.poll(async () => (await diagram.model.nodes()).length).toBe(4);
    const nodes = await diagram.model.nodes();
    const pastedGroup = nodes.find((n) => n.id !== 'outside' && 'isGroup' in n && n.isGroup);
    expect(pastedGroup).toBeDefined();
    const pastedChildren = nodes.filter((n) => n.groupId === pastedGroup!.id);
    expect(pastedChildren).toHaveLength(2);

    // Hidden content round-trips hidden: still mounted, and never pasted as an
    // invisible selection — only the visible group is selected.
    for (const child of pastedChildren) {
      expect(child.hidden).toBe(true);
      expect(child.selected).not.toBe(true);
      await expect(diagram.node(child.id)).toBeAttached();
      await expect(diagram.node(child.id)).toHaveCSS('display', 'none');
    }
    expect(pastedGroup!.selected).toBe(true);

    // The internal edge was re-created between the pasted children.
    const edges = await diagram.model.edges();
    expect(edges).toHaveLength(1);
    expect(pastedChildren.map((c) => c.id)).toEqual(expect.arrayContaining([edges[0].source, edges[0].target]));
  });
});
