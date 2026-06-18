import { expect, test } from './fixtures/diagram';

test.describe('node transforms', () => {
  test('resizeNode() writes the new size onto the node', async ({ diagram }) => {
    await diagram.load();

    await diagram.nodes.resizeNode('node-a', { width: 200, height: 120 });

    await expect
      .poll(async () => (await diagram.model.getNodeById('node-a'))?.size)
      .toEqual({
        width: 200,
        height: 120,
      });
  });

  test('rotateNodeTo() writes the angle onto the node', async ({ diagram }) => {
    await diagram.load();

    await diagram.nodes.rotateNodeTo('node-a', 45);

    await expect.poll(async () => (await diagram.model.getNodeById('node-a'))?.angle).toBe(45);
  });

  test('bringToFront() raises the node above its siblings', async ({ diagram }) => {
    await diagram.load();

    await diagram.nodes.bringToFront(['node-a']);

    const a = (await diagram.model.getNodeById('node-a'))!;
    const b = (await diagram.model.getNodeById('node-b'))!;
    expect(a.computedZIndex ?? 0).toBeGreaterThan(b.computedZIndex ?? 0);
  });

  test('sendToBack() pushes the node below its siblings', async ({ diagram }) => {
    await diagram.load();

    await diagram.nodes.sendToBack(['node-a']);

    const a = (await diagram.model.getNodeById('node-a'))!;
    const b = (await diagram.model.getNodeById('node-b'))!;
    expect(a.computedZIndex ?? 0).toBeLessThan(b.computedZIndex ?? 0);
  });
});
