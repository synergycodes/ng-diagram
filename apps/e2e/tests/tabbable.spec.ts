import { expect, test, type Diagram } from './fixtures/diagram';

/**
 * The `tabbable` input decides whether the diagram takes part in the page's
 * sequential Tab order. Only a real browser can answer that — jsdom has no
 * sequential focus navigation, so the unit specs can assert the attribute but
 * never the traversal this feature is about.
 */

/** Buttons around the diagram, so Tab has somewhere to come from and go to. */
const addTabProbes = async (diagram: Diagram): Promise<void> => {
  await diagram.page.evaluate(() => {
    const before = document.createElement('button');
    before.dataset.probe = 'before';
    document.body.prepend(before);

    const after = document.createElement('button');
    after.dataset.probe = 'after';
    document.body.append(after);
  });
};

const focusProbe = (diagram: Diagram, probe: 'before' | 'after'): Promise<void> =>
  diagram.page.evaluate((name) => {
    document.querySelector<HTMLElement>(`[data-probe="${name}"]`)?.focus();
  }, probe);

/** Short label for whatever holds focus, so failures read as a Tab sequence. */
const focused = (diagram: Diagram): Promise<string> =>
  diagram.page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element || element === document.body) return 'body';
    if (element.dataset.probe) return `probe:${element.dataset.probe}`;
    if (element.closest('ng-diagram-watermark')) return 'watermark';
    return element.tagName.toLowerCase();
  });

test.describe('tabbable', () => {
  test('by default Tab reaches the diagram and then the watermark link', async ({ diagram }) => {
    await diagram.load();
    await addTabProbes(diagram);
    await focusProbe(diagram, 'before');

    await diagram.page.keyboard.press('Tab');
    expect(await focused(diagram)).toBe('ng-diagram');

    await diagram.page.keyboard.press('Tab');
    expect(await focused(diagram)).toBe('watermark');
  });

  test('with tabbable=false Tab skips both the diagram and the watermark link', async ({ diagram }) => {
    await diagram.load({ tabbable: false });
    await addTabProbes(diagram);
    await focusProbe(diagram, 'before');

    await diagram.page.keyboard.press('Tab');

    expect(await focused(diagram)).toBe('probe:after');
  });

  test('with tabbable=false the watermark link stays clickable and in the accessibility tree', async ({ diagram }) => {
    await diagram.load({ tabbable: false });

    const link = diagram.page.locator('ng-diagram-watermark a');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://www.ngdiagram.dev/');
    // Hiding a clickable element from assistive tech would be a new WCAG defect
    await expect(link).not.toHaveAttribute('aria-hidden');
    await expect(link.locator('.sr-only')).toHaveText('ngDiagram');
  });

  test('with tabbable=false clicking the diagram still enables keyboard shortcuts', async ({ diagram }) => {
    await diagram.load({ tabbable: false });
    await addTabProbes(diagram);
    // Focus starts outside the diagram, exactly like the roving-tabindex apps this input is for
    await focusProbe(diagram, 'before');

    await diagram.node('node-a').click();
    await diagram.page.keyboard.press('Delete');

    await expect.poll(async () => await diagram.model.getNodeById('node-a')).toBeFalsy();
    await expect(diagram.node('node-a')).toHaveCount(0);
  });
});
