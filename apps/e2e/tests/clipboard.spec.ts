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
});
