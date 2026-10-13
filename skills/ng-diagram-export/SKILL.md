---
name: ng-diagram-export
description: Use when exporting an ng-diagram as an image (PNG, JPEG or SVG with html-to-image) or as a JSON file, choosing the export region, or fixing cropped, offset, blank or incomplete image exports.
license: Apache-2.0
---

# Export: images and JSON

Image export captures the rendered DOM with [html-to-image](https://www.npmjs.com/package/html-to-image), like the docs "Download Image" example (https://www.ngdiagram.dev/docs/examples/download-image/). JSON export is `toJSON()`; saving and loading in depth is in `ng-diagram-persistence`, viewport math in `ng-diagram-viewport`.

`npm install html-to-image` (the docs example uses 1.11.11).

## Rules

- Capture `ng-diagram-canvas`, the element inside `<ng-diagram>` that holds the nodes and edges, and replace its pan/zoom transform with `translate(-x, -y) scale(1)`, where `(x, y)` is the top-left corner of the region you export. Then the image does not depend on the current pan and zoom.
- Get the region from `computePartsBounds(nodes, edges)` plus a margin. It uses the measured bounds (ports, rotation, edge points, edge labels) and skips hidden elements (since 1.4.0). Pass both lists, so edges and their labels count too. (Before 1.4.0 an empty list, or an edge without points, stretched the result to include `(0, 0)`.)
- The image is a copy of the DOM: export after `diagramInit`, `await` your changes, and wait until the DOM shows them (`waitForRender` below). Until the first change detection after init the canvas has `visibility: hidden`, so a capture made right then is blank.
- The canvas is transparent: pass `backgroundColor`. `<ng-diagram>` paints `--ngd-diagram-background-color`; read it with `getComputedStyle`. The dot or grid background is a sibling of the canvas and is not in the image.
- Set `pixelRatio` yourself; the default is the screen's `devicePixelRatio`, so files differ between screens. html-to-image scales a canvas wider or taller than 16384 px down (unless `skipAutoScale`), but it does not check the area: browsers limit it too (iOS: 4096 × 4096 px), and a bigger canvas stays blank. The service below lowers the ratio for big diagrams.
- With virtualization only the elements near the viewport are in the DOM, so a DOM capture misses the rest. Build the file from the model data instead, or turn virtualization off for the export (it needs a model re-init, see `ng-diagram-performance`).

## Export service

```typescript
import { inject, Injectable } from '@angular/core';
import { toBlob, toJpeg, toSvg } from 'html-to-image';
import { NgDiagramModelService } from 'ng-diagram';

const MARGIN = 40; // px of empty space around the content
const MAX_CANVAS_AREA = 4096 * 4096; // iOS limit; a bigger canvas stays blank

interface CaptureOptions {
  width: number;
  height: number;
  backgroundColor: string;
  pixelRatio: number;
  style: { transform: string; transformOrigin: string };
}

/** Resolves after change detection has written the latest model state to the DOM. */
export const waitForRender = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

/** Copies the computed stroke of every edge path to inline styles; returns a function that restores them. */
export function inlineEdgeStrokes(canvas: HTMLElement): () => void {
  const restores: (() => void)[] = [];
  canvas.querySelectorAll<SVGPathElement>('ng-diagram-base-edge path').forEach((path) => {
    const previous = path.getAttribute('style');
    const computed = getComputedStyle(path);
    for (const prop of ['stroke', 'stroke-width', 'stroke-dasharray', 'stroke-opacity']) {
      path.style.setProperty(prop, computed.getPropertyValue(prop));
    }
    restores.push(() => (previous === null ? path.removeAttribute('style') : path.setAttribute('style', previous)));
  });
  return () => restores.forEach((restore) => restore());
}

@Injectable()
export class DiagramExportService {
  private readonly modelService = inject(NgDiagramModelService);

  /** `diagramEl` is the <ng-diagram> host element. */
  async png(diagramEl: HTMLElement, fileName = 'diagram.png'): Promise<void> {
    const blob = await this.capture(diagramEl, (canvas, options) => toBlob(canvas, options));
    if (blob) this.download(URL.createObjectURL(blob), fileName, true);
  }

  async jpeg(diagramEl: HTMLElement, fileName = 'diagram.jpg'): Promise<void> {
    const url = await this.capture(diagramEl, (canvas, options) => toJpeg(canvas, { ...options, quality: 0.95 }));
    if (url) this.download(url, fileName);
  }

  // HTML inside an SVG <foreignObject>: fine for browsers, not an editable vector drawing
  async svg(diagramEl: HTMLElement, fileName = 'diagram.svg'): Promise<void> {
    const url = await this.capture(diagramEl, (canvas, options) => toSvg(canvas, options));
    if (url) this.download(url, fileName);
  }

  private async capture<T>(
    diagramEl: HTMLElement,
    render: (canvas: HTMLElement, options: CaptureOptions) => Promise<T>
  ): Promise<T | null> {
    // Nodes and edges only: the background pattern, watermark and panels are outside this element
    const canvas = diagramEl.querySelector<HTMLElement>('ng-diagram-canvas');
    const model = this.modelService.getModel();
    // Measured bounds of visible content: ports, rotation, edge points and labels included
    const bounds = this.modelService.computePartsBounds(model.getNodes(), model.getEdges());
    if (!canvas || !bounds.width || !bounds.height) return null; // nothing measured yet

    const x = bounds.x - MARGIN;
    const y = bounds.y - MARGIN;
    const width = bounds.width + 2 * MARGIN;
    const height = bounds.height + 2 * MARGIN;
    const background = getComputedStyle(diagramEl).backgroundColor;
    const restoreEdges = inlineEdgeStrokes(canvas); // edge strokes as inline styles while copying
    try {
      return await render(canvas, {
        width,
        height,
        // the canvas is transparent: paint the diagram background (fallback: white)
        backgroundColor: background === 'rgba(0, 0, 0, 0)' ? '#ffffff' : background,
        // sharp on high-DPI screens, but never above the canvas area browsers can draw
        pixelRatio: Math.min(2, Math.sqrt(MAX_CANVAS_AREA / (width * height))),
        // replaces the pan/zoom transform: flow point (x, y) lands at image pixel (0, 0)
        style: { transform: `translate(${-x}px, ${-y}px) scale(1)`, transformOrigin: 'top left' },
      });
    } finally {
      restoreEdges();
    }
  }

  private download(url: string, fileName: string, revoke = false): void {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    if (revoke) URL.revokeObjectURL(url);
  }
}
```

The docs example computes the box from node `position` + `size` and uses `translate(Math.abs(left), Math.abs(top))`. That is correct only while the box starts at negative coordinates; for content placed at positive coordinates use `-x`/`-y` as above.

## Wiring, selection, JSON

```typescript
// providers: [provideNgDiagram(), DiagramExportService]
private readonly diagramRef = viewChild.required(NgDiagramComponent, { read: ElementRef });

async exportPng(): Promise<void> {
  // Selected elements show outlines and handles in the image: clear the selection, restore it after
  const model = this.modelService.getModel();
  const nodeIds = model.getNodes().filter((n) => n.selected).map((n) => n.id);
  const edgeIds = model.getEdges().filter((e) => e.selected).map((e) => e.id);
  await this.selection.deselectAll();
  await waitForRender(); // the DOM updates with the next change detection, not on await
  try {
    await this.exporter.png(this.diagramRef().nativeElement);
  } finally {
    await this.selection.select(nodeIds, edgeIds);
  }
}

// toJSON() drops computed values (measured*, computed*, node selection); details in ng-diagram-persistence
exportJson(): void {
  const blob = new Blob([this.modelService.toJSON()], { type: 'application/json' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'diagram.json';
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

async importJson(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const data: Partial<Model> = JSON.parse(await file.text());
  this.model.set(initializeModel(data, this.injector)); // a new model re-initializes the diagram
}
```

`model` is a `signal(initializeModel())` bound as `<ng-diagram [model]="model()" />`.

## What you see, with the background

Capturing `<ng-diagram>` itself gives the current view, including the dot or grid background and the watermark. Fit first and wait for the DOM:

```typescript
export async function exportView(viewport: NgDiagramViewportService, diagramEl: HTMLElement): Promise<string> {
  await viewport.zoomToFit({ padding: 40 });
  await waitForRender(); // the new transform reaches the DOM with the next change detection
  return toJpeg(diagramEl, {
    quality: 0.95,
    pixelRatio: 2,
    // the capture includes everything inside <ng-diagram>; leave out what should not be in the image
    filter: (node) => !(node instanceof HTMLElement && node.dataset['exportIgnore'] === 'true'),
  });
}
```

The resolution is limited to the element size times `pixelRatio`, and the user's view changes. `zoomToFit()` is disabled under virtualization.

## Vector and CAD files

`toSvg` wraps the copied HTML in an SVG `<foreignObject>`. Browsers show it, but it is not a clean vector drawing. For editable SVG or DXF, generate the file from the model: node `position`, `size` and `angle`, edge `points`, and your `data`. The official templates show complete exporters:

- Electric Circuit: SVG built from the model, JPEG capture, JSON — https://github.com/synergycodes/ng-diagram-electric-circuit
- AV Schematic: PNG capture, DXF from the model — https://github.com/synergycodes/ng-diagram-av-schematic
- Assembly Line: PNG and SVG captures (with the edge-stroke fix and SVG style pruning), DXF from the model — https://github.com/synergycodes/ng-diagram-assembly-line

## Edge cases

- Hidden elements: their `display: none` is copied, so they are not in the image, and `computePartsBounds` leaves them out.
- Edges styled through CSS variables: the base edge sets `stroke`, `stroke-width`, `stroke-dasharray` and `stroke-opacity` as SVG attributes that hold `var(...)`. The service copies the computed values to inline styles during the capture and restores them after (`inlineEdgeStrokes`); the Assembly Line template does the same to keep edge colors and dashes in its exports.
- Fonts: html-to-image embeds web fonts by reading the page's font CSS. Cross-origin font stylesheets can fail with CORS errors; `skipFonts: true` skips embedding (check the text afterwards) and `fontEmbedCSS` lets you pass the CSS yourself.
- Images in node templates are fetched and inlined. A failed fetch (no CORS headers, 404) logs a console warning and leaves the image empty; `imagePlaceholder` sets a replacement and `cacheBust: true` avoids stale cached copies.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Nothing is downloaded | Nothing is measured yet (before `diagramInit`, or right after loading a new model): export after `diagramInit` |
| Image is blank | Captured while the canvas was still hidden (right inside `(diagramInit)`: `await waitForRender()` first), or the canvas area is too big (lower `pixelRatio`) |
| Big diagram exports blank, often on iPhone/iPad | Canvas area limit: keep `width × height × pixelRatio²` under 4096 × 4096 (formula in the service), or export SVG |
| Content cut off or shifted | Region from `position`/`size` only, or `Math.abs(left)` with content at positive coordinates: use `computePartsBounds` and `translate(-x, -y)` |
| Huge empty margin toward the top-left | Before 1.4.0 `computePartsBounds` with an empty list or unrouted edges included `(0, 0)`: upgrade, or on 1.3.x build the box from the nodes' `measuredBounds` and the `points` of routed edges |
| Large diagram: parts missing | Virtualization: only rendered elements are in the DOM; export from the model or without virtualization |
| Selection frame or resize handles in the image | `deselectAll()`, then `waitForRender()`, then capture |
| Image shows the state before my change | The DOM updates with change detection: `await` the change, then `waitForRender()` |
| Transparent or wrong background | Pass `backgroundColor` (read from `<ng-diagram>`); the grid/dots are only in a capture of `<ng-diagram>` |
| Edges lose color or dash pattern | Inline the computed strokes during the capture (`inlineEdgeStrokes` in the service) |
| CORS errors from fonts or images | `skipFonts`, `fontEmbedCSS`, CORS headers on images, `imagePlaceholder` |
| Image blurry or a different size on another screen | Set `pixelRatio` explicitly; huge images are scaled down (16384 px per side, area limit) |
| SVG looks wrong in a vector editor | `toSvg` output is HTML in `<foreignObject>`; generate SVG/DXF from the model |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
