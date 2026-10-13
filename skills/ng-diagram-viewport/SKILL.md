---
name: ng-diagram-viewport
description: Use when an ng-diagram must pan or zoom from code (zoomToFit, centerOnNode, setViewport, zoom buttons, zoom limit warnings), convert mouse coordinates to diagram positions, disable panning, or save and restore the view.
license: Apache-2.0
---

# Viewport: pan, zoom, fit, coordinates

`NgDiagramViewportService` and the viewport settings. Image export is in `ng-diagram-export`, virtualization in `ng-diagram-performance`, every config key in `ng-diagram-config`, keyboard shortcuts in `ng-diagram-shortcuts`, touch gestures in `ng-diagram-touch`.

## How the viewport works

- Diagram (flow) coordinates: `node.position` is the top-left corner, edges have `points`. They do not change when the user pans or zooms. Children of a group keep global positions.
- `metadata.viewport` is `{ x, y, scale, width?, height? }`. `x`/`y` is the pan offset: where the flow origin `(0, 0)` is drawn, in px from the top-left corner of `<ng-diagram>` (the `Viewport` TSDoc calls it the viewport center; it is not). `width`/`height` is the size of that element. A flow point is drawn at `point * scale + (x, y)`.
- Service signals: `viewport()`, `scale()`, `canZoomIn()`, `canZoomOut()`. Getters: `minZoom`, `maxZoom` (config `zoom.min` 0.01, `zoom.max` 10).

## Rules

- Use the services inside the `provideNgDiagram()` tree, after `<ng-diagram>` has created its engine. Before that, the methods and `minZoom`/`maxZoom`/`canZoomIn()`/`canZoomOut()` throw `[ngDiagram] Library engine not initialized yet`. Wait for `(diagramInit)` or `NgDiagramService.isInitialized()`.
- Every pan/zoom/fit method returns a `Promise<void>` (since 1.3.0; before, `void`). `await` it when the next line needs the new view. `viewport()`/`scale()` refresh with change detection, so right after an `await` read `modelService.getModel().getMetadata().viewport`.
- Fit and center use measured sizes. After adding or resizing elements, `await` the change with `{ waitForMeasurements: true }` first (per-method option since 1.3.0; before, use it on a `transaction`). Unmeasured elements are left out, and `centerOnNode` does nothing for a node without `size`.
- Convert pointer coordinates first: `clientToFlowPosition` for anything stored in the model (`position`, `paste()`), `clientToFlowViewportPosition` for overlays placed inside the diagram area.
- `zoom(factor)` does not clamp. A result outside `zoom.min`/`zoom.max` logs `Zoom scale <s> is out of bounds [min, max]` and nothing changes. It keeps `x`/`y`, so it zooms around the flow origin, and its optional second argument is written as the new `x`/`y` (it is not a zoom center). It also reads the scale and offset from the lagging `scale()`/`viewport()` signals, so right after an `await` it can undo a pan you just made. For zoom buttons use `setViewport` as below.
- Change settings at runtime with `NgDiagramService.updateConfig(...)`. A new object in `[config]` reaches the engine only when the model is initialized again.

## Zoom toolbar

```typescript
@Component({
  selector: 'app-zoom-toolbar',
  template: `
    <button (click)="zoomBy(1.2)" [disabled]="!canZoomIn()">+</button>
    <span>{{ percent() }}%</span>
    <button (click)="zoomBy(1 / 1.2)" [disabled]="!canZoomOut()">-</button>
    <button (click)="zoomTo(1)">100%</button>
    <button (click)="fit()">Fit</button>
  `,
})
export class ZoomToolbarComponent {
  private readonly diagram = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewport = inject(NgDiagramViewportService);

  // canZoomIn/canZoomOut/minZoom/maxZoom read the engine config: guard them until the diagram is ready
  readonly canZoomIn = computed(() => this.diagram.isInitialized() && this.viewport.canZoomIn());
  readonly canZoomOut = computed(() => this.diagram.isInitialized() && this.viewport.canZoomOut());
  readonly percent = computed(() => Math.round(this.viewport.scale() * 100));

  /** Zooms around the center of the diagram element, clamped to zoom.min/zoom.max. */
  async zoomBy(factor: number): Promise<void> {
    const { x, y, scale, width, height } = this.modelService.getModel().getMetadata().viewport;
    if (!width || !height) return;
    const next = Math.min(this.viewport.maxZoom, Math.max(this.viewport.minZoom, scale * factor));
    const cx = width / 2;
    const cy = height / 2;
    await this.viewport.setViewport(cx - ((cx - x) * next) / scale, cy - ((cy - y) * next) / scale, next);
  }

  /** Absolute zoom around the center, e.g. zoomTo(1) for 100%. */
  zoomTo(target: number): Promise<void> {
    return this.zoomBy(target / this.modelService.getModel().getMetadata().viewport.scale);
  }

  fit(): Promise<void> {
    return this.viewport.zoomToFit({ padding: 40 });
  }
}
```

`setViewport(x, y, scale)` (since 1.2.0) clamps `scale` and logs `[ngDiagram] setViewport: scale <s> is outside configured bounds [min, max] and will be clamped.` when it has to. Wheel, pinch and keyboard zoom clamp without a warning.

## Fit and focus

```typescript
async addAndFocus(node: Node): Promise<void> {
  await this.modelService.addNodes([node], { waitForMeasurements: true }); // size known after this
  await this.viewport.zoomToFit({ nodeIds: [node.id], padding: 120 });
}

fitSelection(): Promise<void> {
  const nodeIds = this.modelService.getModel().getNodes().filter((n) => n.selected).map((n) => n.id);
  if (nodeIds.length === 0) return Promise.resolve(); // [] would fit the whole diagram
  return this.viewport.zoomToFit({ nodeIds, padding: [40, 80] }); // [vertical, horizontal]
}
```

- `zoomToFit({ nodeIds?, edgeIds?, padding? })`: `padding` defaults to `zoom.zoomToFit.padding` (50) and takes `n`, `[v, h]`, `[t, h, b]` or `[t, r, b, l]`. The scale is clamped to `zoom.min`/`zoom.max`, so one small node can zoom in up to `zoom.max`. To cap it, see `references/custom-viewport.md`.
- Since 1.4.0, `nodeIds` without `edgeIds` fits those nodes and only the edges between them (before, every edge counted, so the fit showed the whole connected diagram). An empty `nodeIds` array counts as not given: the whole diagram is fitted. Hidden elements are left out. With nothing measurable (empty diagram, unmeasured or only hidden elements) it does nothing.
- `centerOnNode(idOrNode)` and `centerOnRect(rect)` only pan; the scale stays.
- Fit on load: `zoom: { zoomToFit: { onInit: true, padding: 80 } }`. It runs after every model initialization, right after your `(diagramInit)` handler starts. A handler that awaits work (an auto layout, a fetch) finishes later, so call `zoomToFit()` at the end of that handler instead.

## Coordinates: drop, paste, context menu

```typescript
// <div class="wrapper" (contextmenu)="openMenu($event)">   (position: relative, starts at the same corner as <ng-diagram>)
//   <ng-diagram [model]="model" />
//   @if (menu(); as pos) { <div class="menu" [style.left.px]="pos.x" [style.top.px]="pos.y">…</div> }
// </div>
readonly menu = signal<Point | null>(null);
private flowPoint: Point = { x: 0, y: 0 };

openMenu(event: MouseEvent): void {
  event.preventDefault();
  const client = { x: event.clientX, y: event.clientY };
  this.menu.set(this.viewport.clientToFlowViewportPosition(client)); // px inside the wrapper
  this.flowPoint = this.viewport.clientToFlowPosition(client); // diagram coordinates
}

async paste(): Promise<void> {
  this.menu.set(null);
  await this.clipboard.paste(this.flowPoint);
  // or: await this.modelService.addNodes([{ id: 'n1', position: this.flowPoint, data: {} }]);
}
```

| Method | Converts |
| --- | --- |
| `clientToFlowPosition(p)` | `clientX/Y` → diagram coordinates (`(p - elementTopLeft - (x, y)) / scale`) |
| `clientToFlowViewportPosition(p)` | `clientX/Y` → px from the top-left of `<ng-diagram>`; pan and zoom do not matter |
| `flowToClientPosition(p)` | diagram coordinates → `clientX/Y` (for `position: fixed` popups) |

The visible area in flow coordinates is `{ x: -x / scale, y: -y / scale, width: width / scale, height: height / scale }` (from `getModel().getMetadata().viewport`): use its center to add a node in the middle of the view. `moveViewportBy(dx, dy)` pans by screen px, e.g. for arrow buttons.

## Save and restore the view

```typescript
// template: <ng-diagram [model]="model" (viewportChanged)="onViewportChanged($event)" />
private saveTimer?: ReturnType<typeof setTimeout>;
private readonly saved = JSON.parse(localStorage.getItem('viewport') ?? '{"x":0,"y":0,"scale":1}');

// The viewport is model metadata: pass it at init (and leave zoom.zoomToFit.onInit off)
readonly model = initializeModel({ nodes, edges, metadata: { viewport: this.saved } });

// Fires for user and programmatic pan/zoom and for container resizes: debounce
onViewportChanged({ viewport: { x, y, scale } }: ViewportChangedEvent): void {
  clearTimeout(this.saveTimer);
  this.saveTimer = setTimeout(() => localStorage.setItem('viewport', JSON.stringify({ x, y, scale })), 300);
}
```

`toJSON()` already contains `metadata.viewport`, so a saved model restores its view (see `ng-diagram-persistence`). `width`/`height` are read again from the element at init.

## Panning settings

```typescript
setPanning(enabled: boolean): void {
  this.diagram.updateConfig({ viewportPanningEnabled: enabled });
}

// No user panning, zoom locked at 1
export const lockedViewConfig: NgDiagramConfig = {
  viewportPanningEnabled: false,
  zoom: { min: 1, max: 1 },
};
```

- `viewportPanningEnabled: false` (since 0.9.0) turns off dragging the background, wheel and trackpad panning, touch panning, arrow-key panning and edge panning. Zoom and all service methods keep working, and so does the minimap (it pans through the service).
- Edge panning: dragging nodes, or drawing or relinking an edge, near the diagram border moves the view toward that side. Keys and defaults: `ng-diagram-config`.
- Input: the mouse wheel pans (Shift+wheel: horizontally); Ctrl/Cmd+wheel and trackpad pinch zoom at the pointer; a two-finger trackpad swipe pans (trackpad handling improved in 1.2.4). A wheel step or the `=`/`-` keys zoom by `zoom.step` (default 0.03); key bindings are in `ng-diagram-shortcuts`.

Custom fit (zoom cap, own bounds, virtualization) and an animated pan: read `references/custom-viewport.md`.

## Edge cases

- `zoomToFit()` is disabled while virtualization is on: it logs `[ngDiagram] zoomToFit is disabled when virtualization is enabled.` and does nothing. This includes `zoom.zoomToFit.onInit`. Use the custom fit in `references/custom-viewport.md`.
- `zoomToFit()` does nothing while `<ng-diagram>` has no size (`width`/`height` unknown) or when the padding is larger than the element.
- `centerOnNode` uses `position` + `size` and ignores rotation and ports; `zoomToFit` uses `measuredBounds` (ports and rotation included).
- Hidden elements: `zoomToFit` skips them, `centerOnNode` does not (it centers on the last position).
- `moveViewport(x, y)` sets the offset of the flow origin, not "center on this point". To center a point, use `centerOnRect` with a small rect around it.
- While the user pans, viewport moves skip the middleware chain (custom middlewares do not see them); `viewportChanged` still fires.
- `canZoomIn()`/`canZoomOut()` track only the scale: after `updateConfig({ zoom: { min, max } })` they update with the next zoom. If you change the limits at runtime, compute the flags from `diagram.config().zoom` and `viewport.scale()`.
- After `updateConfig({ viewportPanningEnabled: false })` the grab cursor stays: the `pannable` host class comes from `[config]` at model init. Override it, e.g. `.read-only ng-diagram.pannable { cursor: default; }`.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| `zoomToFit()`/`centerOnNode()` ignores new nodes | Not measured yet: `await addNodes(nodes, { waitForMeasurements: true })` (or the same option on the transaction), then fit |
| `zoomToFit()` fits the old content | The mutation was not awaited: `await` it before the fit |
| `zoomToFit({ nodeIds })` shows the whole diagram | Before 1.4.0 every edge was included and bounds could stretch to `(0, 0)`: upgrade, or use the custom fit |
| `zoomToFit()` does nothing + virtualization warning | Disabled with virtualization; use the custom fit |
| Zoom button stops before the limit, console `Zoom scale … is out of bounds` | `zoom()` does not clamp; use `setViewport` with a clamped scale (toolbar recipe) |
| `zoom(1.2, point)` jumps away | The second argument is the new `x`/`y`, not a zoom center |
| `zoom(1)` does not reset to 100%, `zoom(scale * 1.2)` zooms far too much (as on the docs Services page) | `zoom()` multiplies the current scale: use `zoomTo(1)` / `zoomBy(1.2)` from the toolbar |
| `[ngDiagram] Invalid zoom scale: …` or `Invalid scale calculated in zoom-to-fit` | The scale came out 0, NaN or infinite (zero size, NaN in positions or sizes); nothing changes. Check your math and data |
| `[ngDiagram] Library engine not initialized yet` from a toolbar | Service read before `<ng-diagram>` started; guard with `isInitialized()` |
| Drop, paste or new node lands in the wrong place | Raw `clientX/Y` used; convert with `clientToFlowPosition` |
| Menu or overlay is offset | Wrong conversion or wrapper: `clientToFlowViewportPosition` + a `position: relative` wrapper at the diagram's corner |
| Changing `[config]` (zoom limits, panning) has no effect | `[config]` is read at model init: use `updateConfig` |
| Saved viewport ignored on load | `zoom.zoomToFit.onInit` overrides it, or the viewport was not passed in `metadata` |
| Fit on init shows the pre-layout positions | `onInit` runs before your async `diagramInit` work ends; fit at the end of the handler |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
