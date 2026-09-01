import { expect, test } from './fixtures/diagram';

/** The preview content rendered by the harness, at natural size. */
const PREVIEW = { width: 340, height: 200 };

/** Reads the page's scrollable size, which an unclipped off-screen preview would grow. */
const pageScrollSize = async (diagram: { page: { evaluate: <T>(fn: () => T) => Promise<T> } }) =>
  diagram.page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }));

/**
 * Dispatches a real `dragstart` and measures the element the component hands to
 * `setDragImage` while it is still in the document — the drag bitmap itself is drawn by the OS
 * and cannot be captured, but its source element can.
 */
async function measureDragImage(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const draggable = document.querySelector('ng-diagram-palette-item .draggable') as HTMLElement;
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
      root: { width: round(root.width), height: round(root.height), right: round(root.right) },
      content: { width: round(content.width), height: round(content.height) },
      contentOffset: { x: round(content.x - root.x), y: round(content.y - root.y) },
      attachedToBody: (image as HTMLElement).parentElement === document.body,
    };
  });
}

test.describe('palette', () => {
  test('renders one off-screen preview per palette item', async ({ diagram }) => {
    await diagram.load({ palette: true });

    await expect(diagram.parkedPalettePreviews).toHaveCount(2);
    await expect(diagram.palettePanel).toBeVisible();
  });

  // Symptom A of NGD-318: at high zoom the off-screen copy grew sideways until it reached back
  // over its park offset and painted on top of the palette items.
  test('the off-screen preview stays off-screen at every zoom level', async ({ diagram }) => {
    await diagram.load({ palette: true, config: { zoom: { max: 10 } } });
    const previews = diagram.parkedPalettePreviews;

    for (const scale of [1, 5, 10]) {
      await diagram.viewport.setViewport(0, 0, scale);
      await expect.poll(async () => (await diagram.viewport.viewport()).scale).toBe(scale);

      const count = await previews.count();
      for (let index = 0; index < count; index++) {
        const box = (await previews.nth(index).boundingBox())!;
        expect(box.x + box.width, `preview ${index} at scale ${scale} reaches into the page`).toBeLessThanOrEqual(0);
      }
    }
  });

  // Symptom B of NGD-318: the off-screen copy escaped every ancestor's overflow and enlarged the
  // document, putting scrollbars on a page that should not scroll at all.
  test('zooming the diagram does not enlarge the page', async ({ diagram }) => {
    await diagram.load({ palette: true, config: { zoom: { max: 10 } } });
    const before = await pageScrollSize(diagram);

    await diagram.viewport.setViewport(0, 0, 10);
    await expect.poll(async () => (await diagram.viewport.viewport()).scale).toBe(10);

    expect(await pageScrollSize(diagram)).toEqual(before);
  });

  test('the drag image covers the preview and scales with the viewport zoom', async ({ diagram }) => {
    await diagram.load({ palette: true, config: { zoom: { max: 10 } } });

    for (const scale of [1, 2.5]) {
      await diagram.viewport.setViewport(0, 0, scale);
      await expect.poll(async () => (await diagram.viewport.viewport()).scale).toBe(scale);

      const image = (await measureDragImage(diagram.page))!;

      expect(image.attachedToBody, `drag image must be in the document when it is snapshotted`).toBe(true);
      // setDragImage rasterizes the element it is handed, and anchors the cursor at its (0, 0) —
      // so that element has to be the size of the preview, with the content at its origin.
      expect(image.root, `drag image at scale ${scale}`).toEqual({
        width: PREVIEW.width * scale,
        height: PREVIEW.height * scale,
        right: image.root.right,
      });
      expect(image.content).toEqual({ width: PREVIEW.width * scale, height: PREVIEW.height * scale });
      expect(image.contentOffset).toEqual({ x: 0, y: 0 });
      // It is parked off-screen so it cannot flash over the page before it is removed.
      expect(image.root.right).toBeLessThanOrEqual(0);
    }
  });

  test('the drag image is removed from the document after the drag starts', async ({ diagram }) => {
    await diagram.load({ palette: true });
    const clonesInBody = () => diagram.page.locator('body > .dragged-node');

    await measureDragImage(diagram.page);

    await expect(clonesInBody()).toHaveCount(0);
  });
});
