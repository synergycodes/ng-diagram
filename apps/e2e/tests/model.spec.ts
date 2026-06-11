import { expect, test } from './fixtures/diagram';
import { pair, solo } from './fixtures/models';

test.describe('model service', () => {
  test('addNodes() renders the new node', async ({ diagram }) => {
    await diagram.load({ model: solo });

    await diagram.model.addNodes([{ id: 'new', position: { x: 240, y: 240 }, data: { label: 'new' } }]);

    await expect(diagram.node('new')).toBeVisible();
    await expect.poll(async () => (await diagram.model.nodes()).map((n) => n.id)).toEqual(['solo', 'new']);
  });

  test('addEdges() connects two existing nodes', async ({ diagram }) => {
    await diagram.load({ model: pair });
    await expect(diagram.allEdges).toHaveCount(0);

    await diagram.model.addEdges([{ id: 'fresh', source: 'node-a', target: 'node-b', data: {} }]);

    await expect(diagram.edge('fresh')).toBeAttached();
    await expect.poll(async () => (await diagram.model.edges()).map((e) => e.id)).toEqual(['fresh']);
  });

  test('deleteNodes() removes the node and its connected edges', async ({ diagram }) => {
    await diagram.load();

    await diagram.model.deleteNodes(['node-a']);

    await expect(diagram.node('node-a')).toHaveCount(0);
    await expect.poll(async () => (await diagram.model.nodes()).map((n) => n.id)).toEqual(['node-b', 'node-c']);
    await expect.poll(async () => (await diagram.model.edges()).map((e) => e.id)).toEqual([]);
  });

  test('deleteEdges() removes an edge without touching its endpoints', async ({ diagram }) => {
    await diagram.load();

    await diagram.model.deleteEdges(['edge-ab']);

    await expect.poll(async () => (await diagram.model.edges()).map((e) => e.id)).toEqual([]);
    await expect
      .poll(async () => (await diagram.model.nodes()).map((n) => n.id))
      .toEqual(['node-a', 'node-b', 'node-c']);
  });

  test('updateNode() updates the position signal', async ({ diagram }) => {
    await diagram.load();

    await diagram.model.updateNode('node-a', { position: { x: 500, y: 400 } });

    await expect.poll(async () => (await diagram.model.getNodeById('node-a'))?.position).toEqual({ x: 500, y: 400 });
  });

  test('updateNodeData() updates the label data', async ({ diagram }) => {
    await diagram.load();

    await diagram.model.updateNodeData('node-a', { label: 'renamed' });

    await expect
      .poll(async () => (await diagram.model.getNodeById('node-a'))?.data)
      .toMatchObject({ label: 'renamed' });
  });

  test('getConnectedEdges() returns edges incident to a node', async ({ diagram }) => {
    await diagram.load();

    const edges = await diagram.model.getConnectedEdges('node-a');

    expect(edges.map((e) => e.id)).toEqual(['edge-ab']);
  });

  test('getConnectedNodes() returns the neighbours of a node', async ({ diagram }) => {
    await diagram.load();

    const neighbours = await diagram.model.getConnectedNodes('node-a');

    expect(neighbours.map((n) => n.id)).toEqual(['node-b']);
  });
});
