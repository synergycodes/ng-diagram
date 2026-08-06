import type { Point } from 'ng-diagram';
import { expect, test, type Diagram } from './fixtures/diagram';
import { resizeArena } from './fixtures/models';

/**
 * The `activeSides` input of the resize adornment: lines for sides left out are
 * rendered but inert, corner handles render only when both of their sides are
 * listed. Plain resize-gesture semantics live in resize.spec.ts.
 */

const sizeOf = async (diagram: Diagram, id: string) => {
  const node = await diagram.model.getNodeById(id);
  if (!node?.size) throw new Error(`node "${id}" has no size`);
  return { width: node.size.width, height: node.size.height };
};

/**
 * Drag starting a couple of pixels inside the node's border — still within the
 * resize line's 8px hit band, so an active line would capture it, but an inert
 * line lets the pointer fall through to the node body underneath.
 */
const dragThroughLine = async (diagram: Diagram, nodeId: string, side: 'top' | 'right', delta: Point) => {
  const line = diagram.node(nodeId).locator(`.resize-line--${side}`);
  const center = await diagram.centerOf(line, `resize line "${side}" of node "${nodeId}"`);
  const inset = side === 'top' ? { x: 0, y: 2 } : { x: -2, y: 0 };
  const from = { x: center.x + inset.x, y: center.y + inset.y };
  await diagram.beginDrag(from, { x: from.x + delta.x, y: from.y + delta.y });
  await diagram.page.mouse.up();
};

test.describe('resize adornment sides', () => {
  test('default template keeps all four sides and corner handles active', async ({ diagram }) => {
    await diagram.load({ model: resizeArena });
    await diagram.selection.select(['free']);

    await expect(diagram.node('free').locator('.resize-handle')).toHaveCount(4);
    await expect(diagram.node('free').locator('.resize-line')).toHaveCount(4);
    await expect(diagram.node('free').locator('.resize-line--inactive')).toHaveCount(0);
  });

  test('a side listed in activeSides resizes the node', async ({ diagram }) => {
    await diagram.load({ model: resizeArena });
    await diagram.selection.select(['corner']);

    await diagram.dragResizeHandle('corner', 'right', { x: 40, y: 0 });

    await expect.poll(() => sizeOf(diagram, 'corner')).toEqual({ width: 240, height: 120 });
  });

  test('a side left out of activeSides is inert and the drag falls through to the node', async ({ diagram }) => {
    await diagram.load({ model: resizeArena });
    await diagram.selection.select(['corner']);

    const topLine = diagram.node('corner').locator('.resize-line--top');
    await expect(topLine).toHaveClass(/resize-line--inactive/);
    await expect(topLine).toHaveCSS('pointer-events', 'none');

    // Delta large enough that every interpolated pointer step clears the node-drag
    // activation threshold (smaller steps get partially swallowed by it), dragging DOWN,
    // away from the viewport edge, so edge auto-pan does not add extra movement.
    const before = await diagram.nodePosition('corner');
    await dragThroughLine(diagram, 'corner', 'top', { x: 0, y: 72 });

    // The pointer went through the inert line to the node body: the node moved, its size did not change.
    await expect.poll(() => diagram.nodePosition('corner')).toEqual({ x: before.x, y: before.y + 72 });
    await expect.poll(() => sizeOf(diagram, 'corner')).toEqual({ width: 200, height: 120 });
  });

  test('the resize cursor shows over active sides only', async ({ diagram }) => {
    await diagram.load({ model: resizeArena });
    await diagram.selection.select(['corner']);
    await expect(diagram.node('corner').locator('.resize-line--top')).toHaveClass(/resize-line--inactive/);

    // The browser picks the cursor by hit-testing the point and reading the target's
    // computed `cursor` — probe exactly that. Points sit 2px inside the border, within
    // the line's hit band, like the fall-through drags above.
    const probe = (point: Point) =>
      diagram.page.evaluate(({ x, y }) => {
        const target = document.elementFromPoint(x, y);
        if (!target) throw new Error(`nothing at (${x}, ${y})`);
        return { cursor: getComputedStyle(target).cursor, isLine: !!target.closest('ng-diagram-resize-line') };
      }, point);

    const node = diagram.node('corner');
    const right = await diagram.centerOf(node.locator('.resize-line--right'), 'right line');
    const top = await diagram.centerOf(node.locator('.resize-line--top'), 'top line');
    const body = await diagram.centerOf(node, 'node body');

    // Positive control — the method sees the resize cursor on an active line.
    expect(await probe({ x: right.x - 2, y: right.y })).toEqual({ cursor: 'ew-resize', isLine: true });

    // The inert line is transparent to hit-testing: the cursor is whatever the node body shows.
    const overInertTop = await probe({ x: top.x, y: top.y + 2 });
    const overBody = await probe(body);
    expect(overInertTop.isLine).toBe(false);
    expect(overInertTop.cursor).toBe(overBody.cursor);
  });

  test('a corner handle renders only when both of its sides are listed', async ({ diagram }) => {
    await diagram.load({ model: resizeArena });
    await diagram.selection.select(['corner']);

    const handles = diagram.node('corner').locator('.resize-handle');
    await expect(handles).toHaveCount(1);
    await expect(handles).toHaveClass(/resize-handle--bottom-right/);
  });

  test('an empty activeSides keeps the selection frame but disables all resizing', async ({ diagram }) => {
    await diagram.load({ model: resizeArena });
    await diagram.selection.select(['frozen']);

    await expect(diagram.node('frozen').locator('.resize-line--inactive')).toHaveCount(4);
    await expect(diagram.node('frozen').locator('.resize-handle')).toHaveCount(0);

    const before = await diagram.nodePosition('frozen');
    await dragThroughLine(diagram, 'frozen', 'right', { x: 72, y: 0 });

    // The drag fell through to the node body and moved the node — proof the gesture landed
    // on the diagram — while the size stayed untouched.
    await expect.poll(() => diagram.nodePosition('frozen')).toEqual({ x: before.x + 72, y: before.y });
    await expect.poll(() => sizeOf(diagram, 'frozen')).toEqual({ width: 200, height: 120 });
  });
});
