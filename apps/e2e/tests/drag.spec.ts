import { expect, test } from './fixtures/diagram';

const positionOf = async (diagram: import('./fixtures/diagram').Diagram, id: string) => {
  const node = await diagram.model.getNodeById(id);
  if (!node) throw new Error(`node "${id}" not in model`);
  return { x: node.position.x, y: node.position.y };
};

test.describe('node drag', () => {
  test('dragging a node updates its position in the model', async ({ diagram }) => {
    await diagram.load();
    const before = await positionOf(diagram, 'node-a');

    await diagram.dragNode('node-a', { x: 120, y: 60 });

    await expect
      .poll(async () => {
        const after = await positionOf(diagram, 'node-a');
        return { dx: after.x - before.x, dy: after.y - before.y };
      })
      .toEqual({ dx: 120, dy: 60 });
  });

  test('moveNodesBy() through the node service updates the position signal', async ({ diagram }) => {
    await diagram.load();
    const before = await positionOf(diagram, 'node-b');
    const node = (await diagram.model.getNodeById('node-b'))!;

    await diagram.nodes.moveNodesBy([node], { x: 50, y: -25 });

    await expect
      .poll(() => positionOf(diagram, 'node-b'))
      .toEqual({
        x: before.x + 50,
        y: before.y - 25,
      });
  });
});
