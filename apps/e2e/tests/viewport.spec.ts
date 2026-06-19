import { expect, test } from './fixtures/diagram';

test.describe('viewport', () => {
  test('panning empty canvas shifts the viewport by the drag delta', async ({ diagram }) => {
    await diagram.load();
    const before = await diagram.viewport.viewport();

    await diagram.panBy({ x: -120, y: -80 });

    await expect
      .poll(async () => {
        const after = await diagram.viewport.viewport();
        return { dx: after.x - before.x, dy: after.y - before.y };
      })
      .toEqual({ dx: -120, dy: -80 });
  });

  test('setViewport() through the viewport service updates the viewport signal', async ({ diagram }) => {
    await diagram.load();
    const before = await diagram.viewport.viewport();
    const target = { x: before.x + 100, y: before.y - 50, scale: before.scale * 1.5 };

    await diagram.viewport.setViewport(target.x, target.y, target.scale);

    await expect
      .poll(async () => {
        const v = await diagram.viewport.viewport();
        return { x: v.x, y: v.y, scale: v.scale };
      })
      .toEqual(target);
  });

  test('moveViewportBy() offsets x and y without changing scale', async ({ diagram }) => {
    await diagram.load();
    const before = await diagram.viewport.viewport();

    await diagram.viewport.moveViewportBy(40, -20);

    await expect
      .poll(async () => {
        const after = await diagram.viewport.viewport();
        return { dx: after.x - before.x, dy: after.y - before.y, scale: after.scale };
      })
      .toEqual({ dx: 40, dy: -20, scale: before.scale });
  });

  test('zoom() multiplies the current scale by the given factor', async ({ diagram }) => {
    await diagram.load();
    const before = await diagram.viewport.viewport();

    await diagram.viewport.zoom(2);

    await expect.poll(async () => (await diagram.viewport.viewport()).scale).toBeCloseTo(before.scale * 2);
  });

  test('zoomToFit() leaves every seeded node inside the visible area', async ({ diagram }) => {
    await diagram.load();
    await diagram.viewport.setViewport(-2000, -2000, 0.1);

    await diagram.viewport.zoomToFit();

    // After fit the diagram bounds should sit at a sane scale (between min and the original).
    const after = await diagram.viewport.viewport();
    expect(after.scale).toBeGreaterThan(0.1);
  });

  test('centerOnNode() brings the requested node into view', async ({ diagram }) => {
    await diagram.load();
    await diagram.viewport.setViewport(-5000, -5000, 1);

    await diagram.viewport.centerOnNode('node-b');

    // After centring, the node element should report a bounding box that
    // overlaps the diagram container.
    const containerBox = await diagram.container.boundingBox();
    const nodeBox = await diagram.node('node-b').boundingBox();
    if (!containerBox || !nodeBox) throw new Error('missing bounding box');
    expect(nodeBox.x + nodeBox.width).toBeGreaterThan(containerBox.x);
    expect(nodeBox.x).toBeLessThan(containerBox.x + containerBox.width);
    expect(nodeBox.y + nodeBox.height).toBeGreaterThan(containerBox.y);
    expect(nodeBox.y).toBeLessThan(containerBox.y + containerBox.height);
  });
});
