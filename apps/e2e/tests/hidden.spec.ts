import type { Model } from 'ng-diagram';
import { expect, test } from './fixtures/diagram';

/**
 * Hidden elements: a model-level `hidden` flag on nodes and edges.
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
    // measurement expectations. Wait past the hatch window so a late timeout
    // (a delayed diagramInit) cannot slip through unnoticed.
    await diagram.page.waitForTimeout(2500);
    expect(warnings.filter((text) => text.includes('Measurement timeout'))).toEqual([]);
  });

  test('initializes without the measurement timeout when ports and edge labels start hidden', async ({ diagram }) => {
    const warnings: string[] = [];
    diagram.page.on('console', (msg) => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await diagram.load({
      model: {
        nodes: [
          {
            id: 'ports-hidden',
            type: 'hidden-ports',
            position: { x: 80, y: 80 },
            data: { label: 'ports hidden', portsHidden: true },
          },
          { id: 'plain', position: { x: 360, y: 80 }, data: { label: 'plain' } },
        ],
        edges: [
          {
            id: 'edge-hidden-label',
            type: 'labelled',
            source: 'ports-hidden',
            target: 'plain',
            data: { label: 'hidden label', labelHidden: true },
          },
        ],
      },
    });

    // Template-hidden ports and labels stay mounted as display: none from the
    // very first frame — they never get measured.
    await expect(diagram.port('ports-hidden', 'port-left')).toBeAttached();
    await expect(diagram.port('ports-hidden', 'port-left')).toHaveCSS('display', 'none');
    await expect(diagram.port('ports-hidden', 'port-right')).toHaveCSS('display', 'none');
    await expect(diagram.edge('edge-hidden-label').locator('ng-diagram-base-edge-label')).toBeAttached();
    await expect(diagram.edge('edge-hidden-label').locator('ng-diagram-base-edge-label')).toHaveCSS('display', 'none');

    // diagramInit already arrived (load waits for it) — now wait past the 2s
    // safety hatch and assert it never fired: hidden ports/labels must not
    // keep the init event waiting.
    await diagram.page.waitForTimeout(2500);
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

  test('zoomToFit ignores hidden elements and refits once they are unhidden', async ({ diagram }) => {
    await diagram.load({
      model: {
        nodes: [
          { id: 'near-a', position: { x: 0, y: 0 }, data: {} },
          { id: 'near-b', position: { x: 200, y: 120 }, data: {} },
          { id: 'far-hidden', position: { x: 6000, y: 4000 }, hidden: true, data: {} },
        ],
        edges: [],
      },
    });

    await diagram.viewport.zoomToFit();
    const fittedToVisible = await diagram.viewport.viewport();

    // The far node joins the fit only once unhidden — if the hidden node's
    // stale bounds inflated the fit, both scales would be equal.
    await diagram.model.updateNode('far-hidden', { hidden: false });
    await expect.poll(async () => (await diagram.model.getNodeById('far-hidden'))?.size?.width ?? 0).toBeGreaterThan(0);
    await diagram.viewport.zoomToFit();
    const fittedToAll = await diagram.viewport.viewport();

    expect(fittedToVisible.scale).toBeGreaterThan(fittedToAll.scale * 2);
  });

  test('a node whose ports start hidden gets measuredBounds and is not clipped by zoomToFit', async ({ diagram }) => {
    await diagram.load({
      model: {
        nodes: [
          {
            id: 'ports-hidden',
            type: 'hidden-ports',
            position: { x: 0, y: 0 },
            data: { label: 'ports hidden from start', portsHidden: true },
          },
          { id: 'anchor', position: { x: 300, y: 20 }, data: { label: 'anchor' } },
          { id: 'far', position: { x: 4000, y: 2500 }, data: { label: 'far' } },
        ],
        edges: [],
      },
    });

    // Hidden ports never measure, but they must not block measuredBounds —
    // zoomToFit, computePartsBounds and the minimap frame all rely on it.
    await expect.poll(async () => (await diagram.model.getNodeById('ports-hidden'))?.measuredBounds).toBeDefined();

    // The demo repro: delete the far node, then Zoom to Fit.
    await diagram.model.deleteNodes(['far']);
    await diagram.viewport.zoomToFit();

    // The node participates in the fit — nothing is cut off at the edges.
    const nodeBox = await diagram.node('ports-hidden').boundingBox();
    const containerBox = await diagram.container.boundingBox();
    expect(nodeBox).not.toBeNull();
    expect(containerBox).not.toBeNull();
    expect(nodeBox!.x).toBeGreaterThanOrEqual(containerBox!.x);
    expect(nodeBox!.y).toBeGreaterThanOrEqual(containerBox!.y);
    expect(nodeBox!.x + nodeBox!.width).toBeLessThanOrEqual(containerBox!.x + containerBox!.width);
    expect(nodeBox!.y + nodeBox!.height).toBeLessThanOrEqual(containerBox!.y + containerBox!.height);
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

  test('initializes without the measurement timeout when a node is hidden through ngDiagramHidden', async ({
    diagram,
  }) => {
    const warnings: string[] = [];
    diagram.page.on('console', (msg) => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await diagram.load({
      model: {
        nodes: [
          {
            id: 'by-directive',
            type: 'directive-hidden',
            position: { x: 80, y: 80 },
            data: { label: 'hidden by directive', directiveHidden: true },
          },
          { id: 'plain', position: { x: 360, y: 80 }, data: { label: 'plain' } },
        ],
        edges: [{ id: 'edge-to-hidden', source: 'plain', target: 'by-directive', data: {} }],
      },
    });

    // The binding sits on an inner element of the template but hides its
    // OWNER — the node host — and the edge follows its hidden endpoint.
    await expect(diagram.node('by-directive')).toBeAttached();
    await expect(diagram.node('by-directive')).toHaveCSS('display', 'none');
    await expect(diagram.node('plain')).toBeVisible();
    await expect(diagram.edge('edge-to-hidden')).toHaveCSS('display', 'none');

    await diagram.page.waitForTimeout(2500);
    expect(warnings.filter((text) => text.includes('Measurement timeout'))).toEqual([]);
  });

  test('toggles ngDiagramHidden at runtime both ways through the model data', async ({ diagram }) => {
    await diagram.load({
      model: {
        nodes: [
          {
            id: 'by-directive',
            type: 'directive-hidden',
            position: { x: 80, y: 80 },
            data: { label: 'toggled', directiveHidden: false },
          },
          { id: 'plain', position: { x: 360, y: 80 }, data: { label: 'plain' } },
        ],
        edges: [{ id: 'edge-to-toggled', source: 'plain', target: 'by-directive', data: {} }],
      },
    });

    await expect(diagram.node('by-directive')).toBeVisible();
    const measured = await diagram.model.getNodeById('by-directive');
    expect(measured?.size?.width ?? 0).toBeGreaterThan(0);

    await diagram.model.updateNode('by-directive', { data: { label: 'toggled', directiveHidden: true } });
    await expect(diagram.node('by-directive')).toHaveCSS('display', 'none');
    await expect(diagram.edge('edge-to-toggled')).toHaveCSS('display', 'none');
    // Hiding keeps the geometry — the 0×0 report of the now display: none host is rejected.
    expect((await diagram.model.getNodeById('by-directive'))?.size).toEqual(measured?.size);

    await diagram.model.updateNode('by-directive', { data: { label: 'toggled', directiveHidden: false } });
    await expect(diagram.node('by-directive')).toBeVisible();
    await expect(diagram.edge('edge-to-toggled')).not.toHaveCSS('display', 'none');
  });

  test('unhiding a port at runtime makes it a linking target and hiding it again keeps its geometry', async ({
    diagram,
  }) => {
    await diagram.load({
      model: {
        nodes: [
          {
            id: 'target',
            type: 'hidden-ports',
            position: { x: 80, y: 120 },
            data: { label: 'ports hidden', portsHidden: true },
          },
          {
            id: 'source',
            type: 'hidden-ports',
            position: { x: 420, y: 120 },
            data: { label: 'ports visible', portsHidden: false },
          },
        ],
        edges: [],
      },
    });

    const portOf = async (nodeId: string, portId: string) =>
      (await diagram.model.getNodeById(nodeId))?.measuredPorts?.find((port) => port.id === portId);

    // Hidden from the first frame: mounted as display: none, never measured.
    await expect(diagram.port('target', 'port-left')).toHaveCSS('display', 'none');
    expect((await portOf('target', 'port-left'))?.size).toBeUndefined();

    await diagram.model.updateNode('target', { data: { label: 'ports hidden', portsHidden: false } });
    await expect(diagram.port('target', 'port-left')).not.toHaveCSS('display', 'none');
    await expect.poll(async () => (await portOf('target', 'port-left'))?.size?.width ?? 0).toBeGreaterThan(0);

    // Visible and measured — the drawn edge attaches to the port itself.
    await diagram.linkPorts({ node: 'source', port: 'port-right' }, { node: 'target', port: 'port-left' });
    await expect
      .poll(async () =>
        (await diagram.model.edges()).map((edge) => [edge.source, edge.sourcePort, edge.target, edge.targetPort])
      )
      .toEqual([['source', 'port-right', 'target', 'port-left']]);

    const measuredPort = await portOf('target', 'port-left');
    await diagram.model.updateNode('target', { data: { label: 'ports hidden', portsHidden: true } });
    await expect(diagram.port('target', 'port-left')).toHaveCSS('display', 'none');

    // The 0×0 report of the hidden port is rejected — its last geometry stays
    // as the anchor of the edge attached to it.
    const hiddenPort = await portOf('target', 'port-left');
    expect(hiddenPort?.size).toEqual(measuredPort?.size);
    expect(hiddenPort?.position).toEqual(measuredPort?.position);
    expect((await diagram.model.edges()).length).toBe(1);
  });

  test('unhiding a label at runtime measures it and hiding it again keeps its size', async ({ diagram }) => {
    await diagram.load({
      model: {
        nodes: [
          { id: 'a', position: { x: 80, y: 80 }, data: { label: 'a' } },
          { id: 'b', position: { x: 420, y: 80 }, data: { label: 'b' } },
        ],
        edges: [
          {
            id: 'labelled',
            type: 'labelled',
            source: 'a',
            target: 'b',
            data: { label: 'toggled label', labelHidden: true },
          },
        ],
      },
    });

    const labelOf = async () =>
      (await diagram.model.getEdgeById('labelled'))?.measuredLabels?.find((label) => label.id === 'edge-label');
    const label = diagram.edge('labelled').locator('ng-diagram-base-edge-label');

    await expect(label).toHaveCSS('display', 'none');
    expect((await labelOf())?.size).toBeUndefined();

    await diagram.model.updateEdge('labelled', { data: { label: 'toggled label', labelHidden: false } });
    await expect(label).not.toHaveCSS('display', 'none');
    await expect.poll(async () => (await labelOf())?.size?.width ?? 0).toBeGreaterThan(0);
    const measuredLabel = await labelOf();

    await diagram.model.updateEdge('labelled', { data: { label: 'toggled label', labelHidden: true } });
    await expect(label).toHaveCSS('display', 'none');
    expect((await labelOf())?.size).toEqual(measuredLabel?.size);
  });

  test('hiding a group hides its descendants and their edges through inheritance', async ({ diagram }) => {
    await diagram.load({
      model: {
        nodes: [
          {
            id: 'group',
            isGroup: true,
            position: { x: 100, y: 100 },
            size: { width: 360, height: 220 },
            autoSize: false,
            data: {},
          },
          { id: 'child-1', groupId: 'group', position: { x: 140, y: 160 }, data: { label: 'child 1' } },
          { id: 'child-2', groupId: 'group', position: { x: 300, y: 160 }, data: { label: 'child 2' } },
          { id: 'outside', position: { x: 600, y: 160 }, data: { label: 'outside' } },
        ],
        edges: [
          { id: 'internal', source: 'child-1', target: 'child-2', data: {} },
          { id: 'crossing', source: 'child-2', target: 'outside', data: {} },
        ],
      },
    });

    await expect(diagram.node('child-1')).toBeVisible();
    await expect(diagram.edge('crossing')).not.toHaveCSS('display', 'none');

    await diagram.model.updateNode('group', { hidden: true });

    // The children never get a flag of their own — they follow the group, and
    // so do the edges inside it and the one crossing its boundary.
    for (const id of ['group', 'child-1', 'child-2']) {
      await expect(diagram.node(id)).toHaveCSS('display', 'none');
    }
    await expect(diagram.edge('internal')).toHaveCSS('display', 'none');
    await expect(diagram.edge('crossing')).toHaveCSS('display', 'none');
    await expect(diagram.node('outside')).toBeVisible();
    const child = await diagram.model.getNodeById('child-1');
    expect(child?.hidden).toBeUndefined();
    expect(child?.computedHidden).toBe(true);

    await diagram.model.updateNode('group', { hidden: false });

    for (const id of ['group', 'child-1', 'child-2']) {
      await expect(diagram.node(id)).toBeVisible();
    }
    await expect(diagram.edge('crossing')).not.toHaveCSS('display', 'none');
    expect((await diagram.model.getNodeById('child-1'))?.computedHidden).toBe(false);
  });

  test('an edge hidden by its own flag stays mounted, is skipped by select all and comes back on unhide', async ({
    diagram,
  }) => {
    await diagram.load({
      model: {
        nodes: [
          { id: 'a', position: { x: 80, y: 80 }, data: { label: 'a' } },
          { id: 'b', position: { x: 420, y: 80 }, data: { label: 'b' } },
        ],
        edges: [
          { id: 'own-hidden', source: 'a', target: 'b', hidden: true, data: {} },
          { id: 'visible', source: 'b', target: 'a', data: {} },
        ],
      },
    });

    await expect(diagram.edge('own-hidden')).toBeAttached();
    await expect(diagram.edge('own-hidden')).toHaveCSS('display', 'none');
    await expect(diagram.edge('visible')).not.toHaveCSS('display', 'none');

    await diagram.node('a').click();
    await diagram.page.keyboard.press('Control+a');
    await diagram.page.keyboard.press('Meta+a');
    await expect
      .poll(async () => (await diagram.selection.selection()).edges.map((edge) => edge.id))
      .toEqual(['visible']);

    await diagram.model.updateEdge('own-hidden', { hidden: false });
    await expect(diagram.edge('own-hidden')).not.toHaveCSS('display', 'none');
  });
});
