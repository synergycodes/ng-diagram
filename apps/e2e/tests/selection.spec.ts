import { expect, test } from './fixtures/diagram';

test.describe('selection', () => {
  test('clicking a node selects it', async ({ diagram }) => {
    await diagram.load();

    await diagram.node('node-a').click();

    await expect.poll(async () => (await diagram.selection.selection()).nodes.map((n) => n.id)).toEqual(['node-a']);
  });

  test('clicking an edge selects it', async ({ diagram }) => {
    await diagram.load();

    // The edge wrapper is positioned at the SVG origin, so click the rendered
    // path inside it — that's what users actually see and aim for.
    await diagram.edge('edge-ab').locator('path').first().click({ force: true });

    await expect.poll(async () => (await diagram.selection.selection()).edges.map((e) => e.id)).toEqual(['edge-ab']);
  });

  test('clicking the empty canvas clears the selection', async ({ diagram }) => {
    await diagram.load();
    await diagram.node('node-a').click();

    await diagram.clickCanvas();

    await expect.poll(async () => (await diagram.selection.selection()).nodes).toEqual([]);
  });

  test('selection service can replace and clear the selection', async ({ diagram }) => {
    await diagram.load();

    await diagram.selection.select(['node-a', 'node-b']);
    await expect
      .poll(async () => (await diagram.selection.selection()).nodes.map((n) => n.id).sort())
      .toEqual(['node-a', 'node-b']);

    await diagram.selection.deselectAll();
    await expect.poll(async () => (await diagram.selection.selection()).nodes).toEqual([]);
  });

  test('pressing Delete removes the selected nodes', async ({ diagram }) => {
    await diagram.load();
    await diagram.node('node-c').click();

    await diagram.page.keyboard.press('Delete');

    await expect.poll(async () => (await diagram.model.nodes()).map((n) => n.id)).toEqual(['node-a', 'node-b']);
    await expect(diagram.node('node-c')).toHaveCount(0);
  });

  test('deleting the selection removes the selected nodes from the model', async ({ diagram }) => {
    await diagram.load();

    await diagram.selection.select(['node-c']);
    await diagram.selection.deleteSelection();

    await expect.poll(async () => (await diagram.model.nodes()).map((n) => n.id)).toEqual(['node-a', 'node-b']);
    await expect(diagram.node('node-c')).toHaveCount(0);
  });
});
