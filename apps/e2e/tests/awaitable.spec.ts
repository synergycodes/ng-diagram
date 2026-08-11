import { expect, test } from './fixtures/diagram';
import { solo } from './fixtures/models';

/**
 * Awaitable-mutation invariant: a promise returned by a mutating service
 * method resolves only after the change has been committed to the model.
 * Reads happen synchronously after the await, inside a single browser task —
 * no polling, no extra ticks.
 */
test.describe('awaitable mutations', () => {
  test('await addNodes() reads back fresh from the model synchronously', async ({ diagram }) => {
    await diagram.load({ model: solo });

    const readBack = await diagram.page.evaluate(async () => {
      const handle = window.__diagram!;
      await handle.model.addNodes([{ id: 'awaited', position: { x: 300, y: 300 }, data: { label: 'new' } }]);
      return {
        byId: handle.model.getNodeById('awaited')?.id ?? null,
        inModel: handle.model
          .getModel()
          .getNodes()
          .some((n) => n.id === 'awaited'),
      };
    });

    expect(readBack).toEqual({ byId: 'awaited', inModel: true });
    await expect(diagram.node('awaited')).toBeVisible();
  });

  test('await updateNode() has committed the position when the promise resolves', async ({ diagram }) => {
    await diagram.load({ model: solo });

    const position = await diagram.page.evaluate(async () => {
      const handle = window.__diagram!;
      await handle.model.updateNode('solo', { position: { x: 512, y: 256 } });
      return handle.model.getNodeById('solo')?.position ?? null;
    });

    expect(position).toEqual({ x: 512, y: 256 });
  });

  test('await deleteNodes() has removed the node when the promise resolves', async ({ diagram }) => {
    await diagram.load({ model: solo });

    const remaining = await diagram.page.evaluate(async () => {
      const handle = window.__diagram!;
      await handle.model.deleteNodes(['solo']);
      return handle.model.getNodeById('solo');
    });

    expect(remaining).toBeNull();
    await expect(diagram.node('solo')).toHaveCount(0);
  });

  test('waitForMeasurements resolves for a data-only update that triggers no measurement', async ({ diagram }) => {
    await diagram.load({ model: solo });

    const label = await diagram.page.evaluate(async () => {
      const handle = window.__diagram!;
      await handle.model.updateNode('solo', { data: { label: 'renamed' } }, { waitForMeasurements: true });
      return (handle.model.getNodeById('solo')?.data as { label?: string })?.label ?? null;
    });

    expect(label).toBe('renamed');
  });

  test('addNodes() with waitForMeasurements resolves with the node measured', async ({ diagram }) => {
    await diagram.load({ model: solo });

    const size = await diagram.page.evaluate(async () => {
      const handle = window.__diagram!;
      await handle.model.addNodes(
        [{ id: 'measured', position: { x: 400, y: 200 }, data: { label: 'measured' } }],
        // Widened discovery window (internal escape hatch) — see awaitable-api.spec.ts.
        { waitForMeasurements: true, _measurementDiscoveryWindowTimeout: 500 } as { waitForMeasurements: boolean }
      );
      return handle.model.getNodeById('measured')?.size ?? null;
    });

    expect(size).not.toBeNull();
    expect(size!.width).toBeGreaterThan(0);
    expect(size!.height).toBeGreaterThan(0);
  });
});
