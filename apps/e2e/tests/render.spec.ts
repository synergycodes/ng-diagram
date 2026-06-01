import { expect, test } from './fixtures/diagram';
import { solo } from './fixtures/models';

test.describe('rendering', () => {
  test('renders the default model with every node and edge attached', async ({ diagram }) => {
    await diagram.load();

    await expect(diagram.container).toBeVisible();
    await expect(diagram.allNodes).toHaveCount(3);
    await expect(diagram.allEdges).toHaveCount(1);

    await expect(diagram.node('node-a')).toBeVisible();
    await expect(diagram.node('node-b')).toBeVisible();
    await expect(diagram.node('node-c')).toBeVisible();
    // Edges render as SVG inside a positioned host — visibility heuristics
    // flag the wrapper as hidden even when the line is drawn. Attached is
    // the right contract.
    await expect(diagram.edge('edge-ab')).toBeAttached();
  });

  test('honours the seed model passed by the test', async ({ diagram }) => {
    await diagram.load({ model: solo });

    await expect(diagram.allNodes).toHaveCount(1);
    await expect(diagram.node('solo')).toBeVisible();
  });
});
