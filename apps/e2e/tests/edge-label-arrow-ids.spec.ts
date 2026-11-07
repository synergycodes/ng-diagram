import type { Model } from 'ng-diagram';
import { expect, test } from './fixtures/diagram';

/**
 * Edge ids may contain `->` (for example ids built as `source:port->target`).
 * The default label of such an edge must be placed when the diagram
 * initializes, like the label of any other edge.
 */

const EDGE_ID = 'node-a:out->node-b';

const arrowIdModel: Partial<Model> = {
  nodes: [
    { id: 'node-a', position: { x: 80, y: 80 }, data: { label: 'A' } },
    { id: 'node-b', position: { x: 360, y: 80 }, data: { label: 'B' } },
  ],
  edges: [{ id: EDGE_ID, source: 'node-a', target: 'node-b', data: { label: 'arrow' } }],
};

test.describe('edge ids that contain ->', () => {
  test('shows the label of a seeded edge whose id contains -> on first render', async ({ diagram }) => {
    await diagram.load({ model: arrowIdModel });

    const label = diagram.edge(EDGE_ID).locator('ng-diagram-base-edge-label');
    await expect(label).toBeVisible();
    await expect(label).toHaveText('arrow');

    const edge = await diagram.model.getEdgeById(EDGE_ID);
    const measuredLabel = edge?.measuredLabels?.find((item) => item.id === 'edge-label');
    expect(measuredLabel).toBeDefined();
    expect(measuredLabel?.position).toEqual({ x: expect.any(Number), y: expect.any(Number) });
  });
});
