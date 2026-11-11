// Captures the live hero diagram as its still image (slot `heroStill`, O7): writes
// src/assets/hero-still.png, the diagram at its natural size, 2x, on a transparent background.
//
//   pnpm --filter landing build && pnpm --filter landing preview   # in one terminal
//   pnpm --filter landing still:capture                             # in another
//
// Run it after every change of the docs example "Landing Page Diagram", together with
// sketch:capture. LANDING_URL defaults to http://localhost:4329/.
//
// The page is reduced to the diagram: every other element is hidden and every background is
// transparent, and the stage is made larger than the diagram, so the island fits it at scale 1.

/* global document, getComputedStyle, DOMMatrix, requestAnimationFrame, Image */

import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.env.LANDING_URL ?? 'http://localhost:4329/';
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'hero-still.png');
const SCALE = 2;
/** Room around the nodes for their shadows; the transparent edge is trimmed afterwards. */
const MARGIN = 48;
/** Transparent padding kept around the trimmed image. */
const PADDING = 8;

const ONLY_THE_DIAGRAM = `
  html, body, .hero { background: transparent !important; }
  .hero::after, .hero-fx, .hero-copy, .hero-sketch, header, .skip-main, .chapter::before, .chapter::after {
    visibility: hidden !important;
  }
  main > :not(#ch-start), footer { display: none !important; }
  .hero-grid { display: block !important; }
  .hero-copy { display: none !important; }
  .hero-stage {
    width: 1000px !important;
    max-width: none !important;
    height: 1000px !important;
    aspect-ratio: auto !important;
    background: none !important;
  }
`;

try {
  await fetch(url);
} catch {
  console.error(`No server at ${url}. Start it with: pnpm --filter landing preview`);
  process.exit(2);
}

const browser = await chromium.launch();
try {
  // A desktop window with a fine pointer, where the island loads; reduced motion skips its fade.
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1300 },
    deviceScaleFactor: SCALE,
    reducedMotion: 'reduce',
  });
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForFunction(() => document.querySelector('[data-hero-diagram]')?.dataset.state === 'live', null, {
    timeout: 30_000,
  });
  await page.addStyleTag({ content: ONLY_THE_DIAGRAM });
  // The island refits on the stage's resize; wait for scale 1 and two quiet frames.
  await page.waitForFunction(
    () => new DOMMatrix(getComputedStyle(document.querySelector('ng-diagram-canvas')).transform).a === 1,
    null,
    { timeout: 10_000 }
  );
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

  // The nodes and their ports, in the window.
  const bounds = await page.evaluate(() => {
    const rects = [...document.querySelectorAll('ng-diagram-node, ng-diagram-port')]
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width && rect.height);
    const left = Math.min(...rects.map((r) => r.left));
    const top = Math.min(...rects.map((r) => r.top));
    return {
      x: left,
      y: top,
      width: Math.max(...rects.map((r) => r.right)) - left,
      height: Math.max(...rects.map((r) => r.bottom)) - top,
    };
  });
  const clip = {
    x: Math.floor(bounds.x - MARGIN),
    y: Math.floor(bounds.y - MARGIN),
    width: Math.ceil(bounds.width + 2 * MARGIN),
    height: Math.ceil(bounds.height + 2 * MARGIN),
  };
  const shot = await page.screenshot({ clip, omitBackground: true });

  // Trim the transparent edge (keeping PADDING), in the page's canvas.
  const trimmed = await page.evaluate(
    async ({ source, padding }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${source}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      let [minX, minY, maxX, maxY] = [canvas.width, canvas.height, -1, -1];
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          if (data[(y * canvas.width + x) * 4 + 3] > 2) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }
      const x = Math.max(0, minX - padding);
      const y = Math.max(0, minY - padding);
      const width = Math.min(canvas.width, maxX + 1 + padding) - x;
      const height = Math.min(canvas.height, maxY + 1 + padding) - y;
      const result = document.createElement('canvas');
      result.width = width;
      result.height = height;
      result.getContext('2d').drawImage(canvas, x, y, width, height, 0, 0, width, height);
      return {
        png: result.toDataURL('image/png').split(',')[1],
        width,
        height,
        edge: minX === 0 || minY === 0 || maxX === canvas.width - 1 || maxY === canvas.height - 1,
      };
    },
    { source: shot.toString('base64'), padding: PADDING * SCALE }
  );
  if (trimmed.edge) {
    throw new Error(`Something drawn reaches the edge of the ${MARGIN}px margin: raise MARGIN.`);
  }
  writeFileSync(out, Buffer.from(trimmed.png, 'base64'));
  console.log(`Wrote ${out}: ${trimmed.width} x ${trimmed.height} px (${SCALE}x).`);
} finally {
  await browser.close();
}
