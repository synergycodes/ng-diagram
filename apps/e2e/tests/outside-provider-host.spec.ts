import { expect, test, type Diagram } from './fixtures/diagram';

/**
 * `<ng-diagram>` rendered outside the DOM of the component that declares
 * `provideNgDiagram()` — the shape produced by `ngTemplateOutlet` in a parent,
 * portals and overlays. The services still come from the declaring component's
 * injector, so nothing in the library may depend on that component's host element.
 */

const rightPortX = async (diagram: Diagram, nodeId: string): Promise<number> => {
  const node = await diagram.model.getNodeById(nodeId);
  const port = node?.measuredPorts?.find(({ id }) => id === 'port-right');
  if (!port?.position) throw new Error(`port-right of "${nodeId}" is not measured`);
  return port.position.x;
};

test.describe('diagram outside the provider host', () => {
  let errors: string[];

  test.beforeEach(async ({ diagram }) => {
    errors = [];
    // Registered before load, so the initial measurement of every node is covered too
    diagram.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await diagram.load({ outsideProviderHost: true });
  });

  test('renders outside the element that declares the providers', async ({ diagram }) => {
    const hostContainsDiagram = await diagram.page.evaluate(
      () => !!document.querySelector('harness-root')?.contains(document.querySelector('ng-diagram'))
    );

    expect(hostContainsDiagram).toBe(false);
    await expect(diagram.allNodes).toHaveCount(3);
    await expect(diagram.node('node-a')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('re-measures ports when a node size changes', async ({ diagram }) => {
    const widthBefore = (await diagram.model.getNodeById('node-a'))!.size!.width;
    const portXBefore = await rightPortX(diagram, 'node-a');

    await diagram.model.updateNode(
      'node-a',
      { size: { width: widthBefore + 120, height: 80 }, autoSize: false },
      { waitForMeasurements: true }
    );

    // The right port moves with the node's right edge without changing its own
    // size, so only the node-level measurement can pick the new position up.
    expect(await rightPortX(diagram, 'node-a')).toBeCloseTo(portXBefore + 120, 0);
    expect(errors).toEqual([]);
  });
});
