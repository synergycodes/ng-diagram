import type { Model } from 'ng-diagram';
import { expect, test } from './fixtures/diagram';
import type { Diagram } from './fixtures/diagram';

/**
 * Resize snapping with a snap offset (SnappingConfig.computeSnapOffsetForNodeSize /
 * defaultResizeSnapOffset, since 1.3.0): snapped sizes follow `offset + n * snap`
 * per axis, sizes never go below the minimum node size, and resizing from the
 * top/left keeps the opposite edge fixed.
 *
 * Snapping config contains functions, which cannot cross the addInitScript
 * serialization boundary — it is applied at runtime via updateConfig inside
 * page.evaluate instead.
 */

const box: Partial<Model> = {
  nodes: [
    {
      id: 'box',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 110 },
      autoSize: false,
      resizable: true,
      data: { label: 'box' },
    },
  ],
  edges: [],
};

/** A group deliberately placed OFF the snap grid, with a child inside — the issue #765 setup. */
const offGridGroup: Partial<Model> = {
  nodes: [
    { id: 'grp', position: { x: 137, y: 84 }, isGroup: true, resizable: true, data: { label: 'group' } },
    { id: 'member', position: { x: 160, y: 140 }, groupId: 'grp', data: { label: 'member' } },
  ],
  edges: [],
};

/** Vertical snap 50 with offset 60 (a 60px "header"), horizontal snap 20 without offset. */
async function enableOffsetSnapping(diagram: Diagram): Promise<void> {
  await diagram.page.evaluate(() => {
    window.__diagram!.diagram.updateConfig({
      snapping: {
        shouldSnapResizeForNode: () => true,
        defaultResizeSnap: { width: 20, height: 50 },
        defaultResizeSnapOffset: { width: 0, height: 60 },
      },
      resize: { getMinNodeSize: () => ({ width: 100, height: 60 }) },
    });
  });
}

async function dragHandle(diagram: Diagram, nodeId: string, handle: string, delta: { x: number; y: number }) {
  const locator = diagram.node(nodeId).locator(`.resize-handle--${handle}`);
  await expect(locator).toBeVisible();
  const boxRect = await locator.boundingBox();
  expect(boxRect).not.toBeNull();
  const cx = boxRect!.x + boxRect!.width / 2;
  const cy = boxRect!.y + boxRect!.height / 2;
  await diagram.page.mouse.move(cx, cy);
  await diagram.page.mouse.down();
  await diagram.page.mouse.move(cx + delta.x / 2, cy + delta.y / 2, { steps: 4 });
  await diagram.page.mouse.move(cx + delta.x, cy + delta.y, { steps: 4 });
  await diagram.page.mouse.up();
}

test.describe('resize snapping with offset', () => {
  test('service resize lands the height on the offset + n * snap sequence', async ({ diagram }) => {
    await diagram.load({ model: box });
    await enableOffsetSnapping(diagram);

    // 95 would snap to 100 on a plain 50 grid; the 60 offset makes it 110
    await diagram.nodes.resizeNode('box', { width: 200, height: 95 }, undefined, true);

    await expect.poll(async () => (await diagram.model.getNodeById('box'))?.size?.height).toBe(110);
    const node = await diagram.model.getNodeById('box');
    expect(node?.position).toEqual({ x: 100, y: 100 });
  });

  test('a size snapped below the minimum bumps to the next valid increment', async ({ diagram }) => {
    await diagram.load({ model: box });
    await enableOffsetSnapping(diagram);

    // Width 70 snaps to 80 on the 20 grid, below the 100 minimum — bumps to 100
    await diagram.nodes.resizeNode('box', { width: 70, height: 110 }, undefined, true);

    await expect.poll(async () => (await diagram.model.getNodeById('box'))?.size?.width).toBe(100);
  });

  test('dragging the bottom-right handle snaps the height onto the offset sequence', async ({ diagram }) => {
    await diagram.load({ model: box });
    await enableOffsetSnapping(diagram);

    await diagram.node('box').click();
    await dragHandle(diagram, 'box', 'bottom-right', { x: 0, y: 40 });

    // 110 + 40 = 150 requested → snaps to 160 (60 + 2 * 50)
    await expect.poll(async () => (await diagram.model.getNodeById('box'))?.size?.height).toBe(160);
    const node = await diagram.model.getNodeById('box');
    expect(node?.size?.width).toBe(200);
    expect(node?.position).toEqual({ x: 100, y: 100 });
  });

  test('dragging the top-right handle keeps the bottom edge fixed and the height on the sequence', async ({
    diagram,
  }) => {
    await diagram.load({ model: box });
    await enableOffsetSnapping(diagram);

    await diagram.node('box').click();
    // Shrink from the top: bottom edge stays at 100 + 110 = 210
    await dragHandle(diagram, 'box', 'top-right', { x: 0, y: 40 });

    await expect.poll(async () => (await diagram.model.getNodeById('box'))?.size?.height).toBe(60);
    const node = await diagram.model.getNodeById('box');
    expect(node!.position.y + node!.size!.height).toBe(210);
    expect(node?.size?.width).toBe(200);
    expect(node?.position.x).toBe(100);
  });

  test('resizing a group with a child does not move the group (issue #765)', async ({ diagram }) => {
    await diagram.load({ model: offGridGroup });
    await diagram.page.evaluate(() => {
      window.__diagram!.diagram.updateConfig({
        snapping: {
          shouldSnapResizeForNode: () => true,
          defaultResizeSnap: { width: 100, height: 50 },
        },
      });
    });

    // The snapping path requires a measured size — wait for measurement to land
    await expect.poll(async () => (await diagram.model.getNodeById('grp'))?.size?.width).toBeGreaterThan(0);
    const before = await diagram.model.getNodeById('grp');

    await diagram.nodes.resizeNode(
      'grp',
      { width: before!.size!.width + 43, height: before!.size!.height + 17 },
      undefined,
      true
    );

    const after = await diagram.model.getNodeById('grp');
    expect(after?.position).toEqual({ x: 137, y: 84 });
  });
});
