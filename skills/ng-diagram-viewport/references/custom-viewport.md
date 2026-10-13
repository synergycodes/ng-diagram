# Custom fit, bounds and animated pan

Use these when `zoomToFit()` is not enough: you want a zoom cap, a different anchor, your own bounds, a fit under virtualization (where `zoomToFit()` is disabled), or a smooth pan. They only use public API: `setViewport`, `moveViewport`, `computePartsBounds` and the model metadata.

The math: a flow point `p` is drawn at `p * scale + (x, y)` inside `<ng-diagram>`. To put the center of a rect in the middle of the element: `x = width / 2 - centerX * scale` (same for `y`). This is what `zoomToFit` does with equal padding on all sides.

```typescript
@Injectable()
export class ViewportTools {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewport = inject(NgDiagramViewportService);

  /** Centers `rect` (flow coordinates) with `padding` px around it, never zooming in past `maxScale`. */
  async fitRect(rect: Rect, padding = 50, maxScale = 1.5): Promise<void> {
    const { width, height } = this.modelService.getModel().getMetadata().viewport;
    if (!width || !height || !rect.width || !rect.height) return;
    const fit = Math.min((width - 2 * padding) / rect.width, (height - 2 * padding) / rect.height);
    const scale = Math.max(this.viewport.minZoom, Math.min(maxScale, this.viewport.maxZoom, fit));
    await this.viewport.setViewport(
      width / 2 - (rect.x + rect.width / 2) * scale,
      height / 2 - (rect.y + rect.height / 2) * scale,
      scale
    );
  }

  /** zoomToFit() with a zoom cap: measured bounds of all visible nodes and edges. */
  fitContent(): Promise<void> {
    const model = this.modelService.getModel();
    return this.fitRect(this.modelService.computePartsBounds(model.getNodes(), model.getEdges()));
  }

  /** Pans smoothly to the viewport offset `target` (the same x/y that moveViewport takes). */
  animateTo(target: Point, ms = 300): Promise<void> {
    const from = this.modelService.getModel().getMetadata().viewport;
    const start = performance.now();
    return new Promise((resolve) => {
      const frame = (now: number) => {
        const t = Math.min((now - start) / ms, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        void this.viewport.moveViewport(from.x + (target.x - from.x) * eased, from.y + (target.y - from.y) * eased);
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
  }
}
```

Notes:

- `computePartsBounds(nodes, edges)` uses `measuredBounds` (ports and rotation included), edge `points` and edge labels, and skips hidden elements (since 1.4.0). With nothing measured it returns `{ x: 0, y: 0, width: 0, height: 0 }`, so `fitRect` returns early. Before 1.4.0 the result could stretch to include `(0, 0)` when a list was empty or an edge had no points.
- Under virtualization, a node that was never rendered has `measuredBounds` only if the model gives it a `size` (from your data or a saved `toJSON()`), and then without its ports. `fitContent()` therefore works there for nodes with a `size`; nodes without one are left out, so give them a `size` in your data.
- Anchor other than the center: replace `width / 2` and `rect.width / 2` with `width * ax` and `rect.width * ax` (`ax` = 0 left, 1 right), the same for `y`.
- `setViewport` logs a warning when the scale is outside `zoom.min`/`zoom.max`; clamping first, as above, avoids it.
- Each `moveViewport` call in `animateTo` runs a full update pass. That is fine for short animations; for long ones, fewer frames are cheaper.
