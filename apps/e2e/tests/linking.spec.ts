import { expect, test } from './fixtures/diagram';
import { pair } from './fixtures/models';

test.describe('linking', () => {
  test('dragging from one node port to another creates an edge', async ({ diagram }) => {
    await diagram.load({ model: pair });
    await expect(diagram.allEdges).toHaveCount(0);

    await diagram.linkPorts({ node: 'node-a', port: 'port-right' }, { node: 'node-b', port: 'port-left' });

    await expect(diagram.allEdges).toHaveCount(1);

    // The DOM count above can be satisfied by the temporary linking edge, and
    // the model signals refresh with change detection — poll instead of a
    // single-shot read to avoid racing the effect flush.
    await expect.poll(async () => (await diagram.model.edges()).length).toBe(1);

    const edges = await diagram.model.edges();
    expect(edges[0]).toMatchObject({ source: 'node-a', target: 'node-b' });
  });
});
