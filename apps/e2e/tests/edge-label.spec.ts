import { expect, test, type Diagram } from './fixtures/diagram';
import { labelArena } from './fixtures/models';

/**
 * The default edge label chip (`ng-diagram-default-edge-label`) — rendered by the
 * default edge and, being public, composable from custom edge templates. The chip
 * styles its own hover and selected states, so the border highlight must work in both hosts.
 */

const chipOf = (diagram: Diagram, edgeId: string) => diagram.edge(edgeId).locator('.ng-diagram-default-edge-label');

/** Hover the chip's host element — the inner div doesn't receive pointer events, but `:hover` still reaches the surrounding edge. */
const hoverChipOf = (diagram: Diagram, edgeId: string) =>
  diagram.edge(edgeId).locator('ng-diagram-default-edge-label').hover();

/** Resolve a `:root`-level CSS custom property to the concrete color the browser computes. */
const resolveColor = (diagram: Diagram, variable: string) =>
  diagram.page.evaluate((name) => {
    const probe = document.createElement('div');
    probe.style.color = `var(${name})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, variable);

test.describe('default edge label chip', () => {
  test('renders the data.label of a default edge', async ({ diagram }) => {
    await diagram.load({ model: labelArena });

    await expect(chipOf(diagram, 'edge-default')).toHaveText('default');
  });

  test('renders projected content from a custom edge template', async ({ diagram }) => {
    await diagram.load({ model: labelArena });

    await expect(chipOf(diagram, 'edge-custom')).toHaveText('custom');
  });

  test('selecting the edge highlights the chip border in a custom template', async ({ diagram }) => {
    await diagram.load({ model: labelArena });
    const chip = chipOf(diagram, 'edge-custom');
    const idle = await chip.evaluate((el) => getComputedStyle(el).borderTopColor);

    await diagram.selection.select([], ['edge-custom']);

    const highlight = await resolveColor(diagram, '--ngd-default-edge-stroke-selected');
    expect(highlight).not.toBe(idle);
    await expect(chip).toHaveClass(/selected/);
    await expect(chip).toHaveCSS('border-top-color', highlight);

    await diagram.selection.deselect([], ['edge-custom']);

    await expect(chip).toHaveCSS('border-top-color', idle);
  });

  test('--edge-label-border-color-selected overrides the highlight color', async ({ diagram }) => {
    await diagram.load({ model: labelArena });
    await diagram.page.addStyleTag({ content: ':root { --edge-label-border-color-selected: rgb(1, 2, 3); }' });

    await diagram.selection.select([], ['edge-custom']);

    await expect(chipOf(diagram, 'edge-custom')).toHaveCSS('border-top-color', 'rgb(1, 2, 3)');
  });

  test('selecting the edge keeps highlighting the chip border in the default template', async ({ diagram }) => {
    await diagram.load({ model: labelArena });
    const chip = chipOf(diagram, 'edge-default');

    await diagram.selection.select([], ['edge-default']);

    await expect(chip).toHaveCSS('border-top-color', await resolveColor(diagram, '--ngd-default-edge-stroke-selected'));
  });

  test('hovering the edge highlights the chip border in a custom template', async ({ diagram }) => {
    await diagram.load({ model: labelArena });
    const chip = chipOf(diagram, 'edge-custom');
    const idle = await chip.evaluate((el) => getComputedStyle(el).borderTopColor);

    await hoverChipOf(diagram, 'edge-custom');

    const highlight = await resolveColor(diagram, '--ngd-default-edge-stroke-hover');
    expect(highlight).not.toBe(idle);
    await expect(chip).toHaveCSS('border-top-color', highlight);

    await diagram.page.mouse.move(0, 0);

    await expect(chip).toHaveCSS('border-top-color', idle);
  });

  test('--edge-label-border-color-hover overrides the highlight color', async ({ diagram }) => {
    await diagram.load({ model: labelArena });
    await diagram.page.addStyleTag({ content: ':root { --edge-label-border-color-hover: rgb(1, 2, 3); }' });

    await hoverChipOf(diagram, 'edge-custom');

    await expect(chipOf(diagram, 'edge-custom')).toHaveCSS('border-top-color', 'rgb(1, 2, 3)');
  });

  test('hovering the edge keeps highlighting the chip border in the default template', async ({ diagram }) => {
    await diagram.load({ model: labelArena });
    const chip = chipOf(diagram, 'edge-default');

    await hoverChipOf(diagram, 'edge-default');

    await expect(chip).toHaveCSS('border-top-color', await resolveColor(diagram, '--ngd-default-edge-stroke-hover'));
  });
});
