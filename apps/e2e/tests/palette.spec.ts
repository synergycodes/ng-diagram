import { expect, test } from './fixtures/diagram';

/** The preview content rendered by the harness, at natural size. */
const PREVIEW = { width: 340, height: 200 };

/** The harness's wide preview — wider than a fixed park offset and than the viewport. */
const WIDE_PREVIEW = { width: 1300, height: 60 };

/** The zoom applied to the drag image is capped here, whatever the viewport scale. */
const MAX_DRAG_IMAGE_ZOOM = 3;

/** Reads the page's scrollable size, which an unclipped off-screen preview would grow. */
const pageScrollSize = async (diagram: { page: { evaluate: <T>(fn: () => T) => Promise<T> } }) =>
  diagram.page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }));

/**
 * Dispatches a real `dragstart` on the given palette item and measures the element the component
 * hands to `setDragImage` while it is still in the document — the drag bitmap itself is drawn by
 * the OS and cannot be captured, but its source element can.
 */
async function measureDragImage(page: import('@playwright/test').Page, itemIndex = 0) {
  return page.evaluate((index) => {
    const draggable = document.querySelectorAll('ng-diagram-palette-item .draggable')[index] as HTMLElement;
    const transfer = new DataTransfer();
    let image: HTMLElement | null = null;
    const original = transfer.setDragImage.bind(transfer);
    transfer.setDragImage = (element, x, y) => {
      image = element as HTMLElement;
      return original(element, x, y);
    };

    draggable.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: transfer }));

    if (!image) return null;
    const root = (image as HTMLElement).getBoundingClientRect();
    const content = (image as HTMLElement).firstElementChild!.getBoundingClientRect();
    const round = (value: number) => Math.round(value);
    return {
      size: { width: round(root.width), height: round(root.height) },
      right: round(root.right),
      content: { width: round(content.width), height: round(content.height) },
      contentOffset: { x: round(content.x - root.x), y: round(content.y - root.y) },
      attachedToBody: (image as HTMLElement).parentElement === document.body,
    };
  }, itemIndex);
}

test.describe('palette', () => {
  test('renders one off-screen preview per palette item', async ({ diagram }) => {
    await diagram.load({ palette: true });

    await expect(diagram.parkedPalettePreviews).toHaveCount(3);
    await expect(diagram.palettePanel).toBeVisible();
  });

  // The containment NGD-318 relies on: each parked copy sits inside an internal wrapper that
  // clips it. This pins the load-bearing styles — deleting them fails here, not in production.
  test('every parked preview is clipped by its internal wrapper', async ({ diagram }) => {
    await diagram.load({ palette: true });

    const clips = await diagram.page.$$eval('ng-diagram-palette-item-preview .preview-clip', (elements) =>
      elements.map((element) => ({
        overflow: getComputedStyle(element).overflow,
        clientHeight: element.clientHeight,
        holdsParkedCopy: element.querySelector(':scope > .dragged-node') !== null,
      }))
    );

    expect(clips).toHaveLength(3);
    for (const clip of clips) {
      expect(clip).toEqual({ overflow: 'hidden', clientHeight: 0, holdsParkedCopy: true });
    }
  });

  // Symptom A of NGD-318: the off-screen copy reached back over its park offset and painted on
  // top of the palette items. The wide preview would do that at any zoom if the clip ever fell.
  test('no preview paints over the palette at any zoom level', async ({ diagram }) => {
    await diagram.load({ palette: true, config: { zoom: { max: 10 } } });

    for (const scale of [1, 5, 10]) {
      await diagram.viewport.setViewport(0, 0, scale);
      await expect.poll(async () => (await diagram.viewport.viewport()).scale).toBe(scale);

      const covered = await diagram.page.evaluate(() =>
        [...document.querySelectorAll('[data-testid="palette-item"]')].map((item) => {
          const box = item.getBoundingClientRect();
          const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
          return Boolean(top && top.closest('ng-diagram-palette-item-preview'));
        })
      );

      for (const [index, coveredByPreview] of covered.entries()) {
        expect(coveredByPreview, `palette item ${index} at scale ${scale} is covered by a preview`).toBe(false);
      }
    }
  });

  // Symptom B of NGD-318: the off-screen copy escaped every ancestor's overflow and enlarged the
  // document, putting scrollbars on a page that should not scroll at all.
  test('zooming the diagram does not enlarge the page', async ({ diagram }) => {
    await diagram.load({ palette: true, config: { zoom: { max: 10 } } });
    const before = await pageScrollSize(diagram);

    // The page must not scroll horizontally at all — the wide parked preview would otherwise
    // stretch it even before any zoom.
    expect(before.width).toBeLessThanOrEqual(await diagram.page.evaluate(() => window.innerWidth));

    await diagram.viewport.setViewport(0, 0, 10);
    await expect.poll(async () => (await diagram.viewport.viewport()).scale).toBe(10);

    expect(await pageScrollSize(diagram)).toEqual(before);
  });

  test('the drag image covers the preview and scales with the viewport zoom, capped at 3x', async ({ diagram }) => {
    await diagram.load({ palette: true, config: { zoom: { max: 10 } } });

    for (const scale of [1, 2.5, 5]) {
      await diagram.viewport.setViewport(0, 0, scale);
      await expect.poll(async () => (await diagram.viewport.viewport()).scale).toBe(scale);

      const image = (await measureDragImage(diagram.page))!;
      const applied = Math.min(scale, MAX_DRAG_IMAGE_ZOOM);

      expect(image.attachedToBody, `drag image must be in the document when it is snapshotted`).toBe(true);
      // setDragImage rasterizes the element it is handed, and anchors the cursor at its (0, 0) —
      // so that element has to be the size of the scaled preview, with the content at its origin.
      expect(image.size, `drag image at scale ${scale}`).toEqual({
        width: PREVIEW.width * applied,
        height: PREVIEW.height * applied,
      });
      expect(image.content).toEqual({ width: PREVIEW.width * applied, height: PREVIEW.height * applied });
      expect(image.contentOffset).toEqual({ x: 0, y: 0 });
      // It is parked off-screen so it cannot flash over the page before it is removed.
      expect(image.right, `drag image at scale ${scale} reaches into the page`).toBeLessThanOrEqual(0);
    }
  });

  // A fixed park offset fails exactly here: content wider than the offset would keep its right
  // edge on-screen, and the clone's shrink-to-fit width would wrap it onto extra lines, so the
  // drag image would no longer match the preview.
  test('the drag image of a wide preview keeps its natural lines and stays off-screen', async ({ diagram }) => {
    await diagram.load({ palette: true, config: { zoom: { max: 10 } } });
    await diagram.viewport.setViewport(0, 0, 3);
    await expect.poll(async () => (await diagram.viewport.viewport()).scale).toBe(3);

    const image = (await measureDragImage(diagram.page, 2))!;

    expect(image.size).toEqual({ width: WIDE_PREVIEW.width * 3, height: WIDE_PREVIEW.height * 3 });
    expect(image.right).toBeLessThanOrEqual(0);
  });

  test('the drag image is removed from the document after the drag starts', async ({ diagram }) => {
    await diagram.load({ palette: true });
    const clonesInBody = () => diagram.page.locator('body > .dragged-node');

    const image = await measureDragImage(diagram.page);

    // The clone must first have existed — otherwise a broken drag-image path would pass this
    // test by never creating one.
    expect(image?.attachedToBody).toBe(true);
    await expect(clonesInBody()).toHaveCount(0);
  });
});
