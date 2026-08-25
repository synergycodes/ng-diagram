import type { Model } from 'ng-diagram';
import { expect, test } from './fixtures/diagram';

/**
 * Hidden elements (NGD-101): a model-level `hidden` flag on nodes and edges.
 * Hidden elements stay mounted as display: none, never block initialization,
 * and are excluded from interactions.
 */
const arena: Partial<Model> = {
  nodes: [
    { id: 'visible-a', position: { x: 80, y: 80 }, data: { label: 'A' } },
    { id: 'hidden-b', position: { x: 320, y: 80 }, hidden: true, data: { label: 'B' } },
    { id: 'node-c', position: { x: 200, y: 260 }, data: { label: 'C' } },
  ],
  edges: [
    // Hidden endpoint — the edge is effectively hidden with it.
    { id: 'edge-ab', source: 'visible-a', target: 'hidden-b', data: {} },
    { id: 'edge-ac', source: 'visible-a', target: 'node-c', data: {} },
  ],
};

test.describe('hidden elements', () => {
  test('initializes without the measurement timeout when the model contains hidden content', async ({ diagram }) => {
    const warnings: string[] = [];
    diagram.page.on('console', (msg) => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await diagram.load({ model: arena });

    // Hidden elements stay mounted as display: none.
    await expect(diagram.node('hidden-b')).toBeAttached();
    await expect(diagram.node('hidden-b')).toBeHidden();
    await expect(diagram.node('visible-a')).toBeVisible();

    // An edge with a hidden endpoint is effectively hidden too. Edge hosts
    // are always "hidden" for Playwright's visibility heuristics (zero-size
    // wrapper), so assert on the computed display instead.
    await expect(diagram.edge('edge-ab')).toBeAttached();
    await expect(diagram.edge('edge-ab')).toHaveCSS('display', 'none');
    await expect(diagram.edge('edge-ac')).toBeAttached();
    await expect(diagram.edge('edge-ac')).not.toHaveCSS('display', 'none');

    // The 2s init safety timeout never fires — hidden content creates no
    // measurement expectations.
    expect(warnings.filter((text) => text.includes('Measurement timeout'))).toEqual([]);
  });

  test('toggles hidden at runtime both ways and re-measures on unhide', async ({ diagram }) => {
    await diagram.load({ model: arena });

    await diagram.model.updateNode('hidden-b', { hidden: false });

    await expect(diagram.node('hidden-b')).toBeVisible();
    await expect(diagram.edge('edge-ab')).not.toHaveCSS('display', 'none');

    // Unhiding re-measures through the ResizeObserver path — the node gets
    // real geometry.
    await expect
      .poll(async () => {
        const node = await diagram.model.getNodeById('hidden-b');
        return node?.size?.width ?? 0;
      })
      .toBeGreaterThan(0);

    const measured = await diagram.model.getNodeById('hidden-b');

    await diagram.model.updateNode('hidden-b', { hidden: true });
    await expect(diagram.node('hidden-b')).toBeHidden();

    // Hiding must not corrupt geometry — the 0×0 ResizeObserver report of the
    // now display: none element is rejected by the zero-size guard.
    const hidden = await diagram.model.getNodeById('hidden-b');
    expect(hidden?.size).toEqual(measured?.size);
  });

  test('select all skips hidden elements', async ({ diagram }) => {
    await diagram.load({ model: arena });

    // Focus the diagram through a node click, then trigger the selectAll
    // shortcut. The binding uses the platform primary modifier — press both
    // variants; the non-matching one is a no-op.
    await diagram.node('visible-a').click();
    await diagram.page.keyboard.press('Control+a');
    await diagram.page.keyboard.press('Meta+a');

    await expect
      .poll(async () => {
        const selection = await diagram.selection.selection();
        return {
          nodes: selection.nodes.map((node) => node.id).sort(),
          edges: selection.edges.map((edge) => edge.id).sort(),
        };
      })
      .toEqual({ nodes: ['node-c', 'visible-a'], edges: ['edge-ac'] });
  });

  test('hidden children move with their dragged group', async ({ diagram }) => {
    const collapsedGroup: Partial<Model> = {
      nodes: [
        {
          id: 'group',
          isGroup: true,
          position: { x: 100, y: 100 },
          size: { width: 300, height: 200 },
          autoSize: false,
          data: {},
        },
        { id: 'child', groupId: 'group', hidden: true, position: { x: 140, y: 160 }, data: { label: 'child' } },
      ],
      edges: [],
    };
    await diagram.load({ model: collapsedGroup });

    const before = await diagram.model.getNodeById('child');
    await diagram.dragNode('group', { x: 120, y: 80 });

    // The hidden child traveled with the group…
    await expect
      .poll(async () => {
        const child = await diagram.model.getNodeById('child');
        return {
          x: Math.round(child!.position.x - before!.position.x),
          y: Math.round(child!.position.y - before!.position.y),
        };
      })
      .toEqual({ x: 120, y: 80 });

    // …so after unhiding it is still inside the group, not left behind.
    await diagram.model.updateNode('child', { hidden: false });
    await expect(diagram.node('child')).toBeVisible();

    const child = await diagram.model.getNodeById('child');
    const group = await diagram.model.getNodeById('group');
    expect(child!.position.x).toBeGreaterThanOrEqual(group!.position.x);
    expect(child!.position.y).toBeGreaterThanOrEqual(group!.position.y);
    expect(child!.position.x).toBeLessThanOrEqual(group!.position.x + group!.size!.width);
    expect(child!.position.y).toBeLessThanOrEqual(group!.position.y + group!.size!.height);
  });

  test('dropping a visible node onto a group does not re-parent a hidden selected node', async ({ diagram }) => {
    const dropArena: Partial<Model> = {
      nodes: [
        {
          id: 'group',
          isGroup: true,
          position: { x: 400, y: 100 },
          size: { width: 300, height: 200 },
          autoSize: false,
          data: {},
        },
        { id: 'dragged', position: { x: 100, y: 150 }, data: { label: 'dragged' } },
        { id: 'hidden-b', position: { x: 100, y: 400 }, hidden: true, data: { label: 'B' } },
      ],
      edges: [],
    };
    await diagram.load({ model: dropArena });

    // Both nodes selected (hidden ones stay selectable programmatically),
    // then the visible one is dragged into the group.
    await diagram.selection.select(['dragged', 'hidden-b']);
    await diagram.dragNode('dragged', { x: 450, y: 50 });

    await expect.poll(async () => (await diagram.model.getNodeById('dragged'))?.groupId).toBe('group');

    // The invisible selected node was not re-parented by the drop.
    const hidden = await diagram.model.getNodeById('hidden-b');
    expect(hidden?.groupId).toBeUndefined();
  });

  test('arrow keys pan the viewport when only hidden nodes are selected', async ({ diagram }) => {
    await diagram.load({ model: arena });

    await diagram.selection.select(['hidden-b']);
    await diagram.clickCanvas();
    await diagram.selection.select(['hidden-b']);

    const before = await diagram.viewport.viewport();
    await diagram.page.keyboard.press('ArrowRight');

    // The move action must decline (nothing visible to move) and panning takes
    // over — arrows never go dead.
    await expect
      .poll(async () => {
        const viewport = await diagram.viewport.viewport();
        return viewport.x !== before.x || viewport.y !== before.y;
      })
      .toBe(true);

    // And the hidden node did not move.
    const hidden = await diagram.model.getNodeById('hidden-b');
    expect(hidden?.position).toEqual({ x: 320, y: 80 });
  });

  test('unhiding renders immediately under virtualization, without panning', async ({ diagram }) => {
    const virtArena: Partial<Model> = {
      nodes: [
        { id: 'visible-a', position: { x: 100, y: 100 }, data: { label: 'A' } },
        { id: 'hidden-b', position: { x: 300, y: 100 }, hidden: true, data: { label: 'B' } },
      ],
      edges: [],
    };
    await diagram.load({ model: virtArena, config: { virtualization: { enabled: true } } });

    await expect(diagram.node('visible-a')).toBeVisible();
    // Under virtualization hidden elements are unmounted, not display:none.
    await expect(diagram.node('hidden-b')).not.toBeAttached();

    await diagram.model.updateNode('hidden-b', { hidden: false });

    // The result cache must invalidate on the visibility flip — the node
    // appears without any pan/zoom.
    await expect(diagram.node('hidden-b')).toBeVisible();

    await diagram.model.updateNode('hidden-b', { hidden: true });
    await expect(diagram.node('hidden-b')).not.toBeAttached();
  });

  test('deleteSelection skips elements hidden after being selected', async ({ diagram }) => {
    await diagram.load({ model: arena });

    await diagram.selection.select(['visible-a']);
    await diagram.model.updateNode('visible-a', { hidden: true });

    await diagram.selection.deleteSelection();

    // Hiding does not deselect, but deleting invisible content is skipped.
    const node = await diagram.model.getNodeById('visible-a');
    expect(node).not.toBeNull();
  });
});
