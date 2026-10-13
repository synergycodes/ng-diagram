# Edge inputs, CSS variables and classes (ng-diagram 1.4.0)

## `<ng-diagram-base-edge>` inputs

| Input | Type | Notes |
| --- | --- | --- |
| `edge` | `Edge` (required) | The edge to draw. Pass `edge()` or an edge you derived from it in a `computed()`. |
| `routing` | `string` | Beats `edge.routing` and is written into the model. |
| `stroke` | `string` | Stroke color. Beats `--edge-stroke`. Any CSS color or `var(...)`. |
| `strokeWidth` | `number` | Beats `--edge-stroke-width`. `0` is ignored (falls back). |
| `strokeOpacity` | `number` | Beats `--edge-stroke-opacity`. `0` is ignored (falls back). |
| `strokeDasharray` | `string` | Beats `--edge-stroke-dasharray`, e.g. `'5 5'`. |
| `sourceArrowhead` | `string` | Marker id. `edge.sourceArrowhead` in the model wins over it. |
| `targetArrowhead` | `string` | Marker id. `edge.targetArrowhead` in the model wins over it. |

## `<ng-diagram-base-edge-label>` inputs

| Input | Type | Notes |
| --- | --- | --- |
| `id` | `string` (required) | Unique within the edge; the measured position is looked up by id. |
| `positionOnEdge` | `number` or `'Npx'` (required) | `0..1` relative (clamped), `'30px'` from the source, `'-20px'` from the target (clamped to the path length). `'Npx'` since 1.1.0. |
| `hidden` | `boolean` (since 1.4.0) | `display: none`, keeps its measured size, never blocks initialization. A plain `hidden` attribute also works. |

`<ng-diagram-default-edge-label>` (since 1.3.0) has no inputs; it wraps projected content in the default label chip.

## Edge CSS variables

Set them on `ng-diagram-base-edge` (or any ancestor). The base edge reads them on its SVG path.

| Variable | Fallback when not set |
| --- | --- |
| `--edge-stroke` | `--ngd-default-edge-stroke` |
| `--edge-stroke-width` | `2` |
| `--edge-stroke-opacity` | `1` |
| `--edge-stroke-dasharray` | `none` |
| `--edge-stroke-transition` | `none` |

What the default edge (`ng-diagram-base-edge.default-edge`) sets in its own encapsulated styles:

| State | Sets |
| --- | --- |
| always | `--edge-stroke: var(--ngd-default-edge-stroke)`, `--edge-stroke-transition: stroke 0.1s ease-in-out` |
| `:hover` (not selected, not temporary) | `--edge-stroke` and `--edge-label-border-color` to `var(--ngd-default-edge-stroke-hover)` |
| `.selected` | `--edge-stroke` and `--edge-label-border-color` to `var(--ngd-default-edge-stroke-selected)` |
| `.temporary` | `--edge-stroke-opacity: 0.5` |

These rules are more specific than a page rule like `ng-diagram-base-edge.default-edge { --edge-stroke: ... }`, so change the default edge colors through the `--ngd-default-edge-stroke*` variables instead:

```scss
ng-diagram {
  --ngd-default-edge-stroke: #64748b;
  --ngd-default-edge-stroke-hover: #334155;
  --ngd-default-edge-stroke-selected: #2563eb;
}
```

The library defines them once on `:root` from primitives (`--ngd-colors-gray-500`, `-gray-700`, `--ngd-colors-acc1-500`), with no dark values, so they do not change with `data-theme="dark"`; add dark values yourself if you need them. Setting them on a single edge works too, for example `ng-diagram-base-edge.dangling { --ngd-default-edge-stroke: #f59e0b; }`.

`--edge-stroke-width` and `--edge-stroke-dasharray` are not set by the default edge, so plain page rules work for them.

## Classes

| Class | Element | Since | Meaning |
| --- | --- | --- | --- |
| `selected` | `ng-diagram-base-edge` | - | edge is selected |
| `temporary` | `ng-diagram-base-edge` | - | preview of a draw or a relink |
| `dangling` | `ng-diagram-base-edge` and its `path` | 1.4.0 | at least one free end; never on previews |
| `default-edge` | `ng-diagram-base-edge` of the default edge | - | built-in template only |
| `ng-diagram-edge--temporary` | `<ng-diagram-edge>` wrapper around your template | 1.4.0 | preview of a draw or a relink |
| `ng-diagram-edge--dangling` | `<ng-diagram-edge>` wrapper | 1.4.0 | free end, not on previews |

## Default label chip variables

Set them on `ng-diagram-default-edge-label` or any ancestor (for example `ng-diagram`).

| Variable | Fallback |
| --- | --- |
| `--edge-label-padding` | `4px 8px` |
| `--edge-label-border-radius` | `4px` |
| `--edge-label-font-size` | `12px` |
| `--edge-label-background-color` | `--ngd-default-edge-label-background-color` |
| `--edge-label-text-color` | `--ngd-default-edge-label-color` |
| `--edge-label-border-width` | `1px` |
| `--edge-label-border-color` | `--ngd-default-edge-label-border-color` |
| `--edge-label-border-transition` | `border-color 0.1s ease-in-out` |
| `--edge-label-border-color-hover` (since 1.3.0) | `--edge-label-border-color`, then `--ngd-default-edge-stroke-hover` |
| `--edge-label-border-color-selected` (since 1.3.0) | `--edge-label-border-color`, then `--ngd-default-edge-stroke-selected` |

The chip shows the hover color while the surrounding `ng-diagram-base-edge` is hovered (not selected, not a preview) and the selected color while the edge is selected, in any edge template. Inside the default edge, use the `-hover`/`-selected` variables: the default edge sets `--edge-label-border-color` itself in those states.

Relink handle variables (`--ngd-relink-handle-*`, `--edge-relink-handle-*`) are listed in the `ng-diagram-edge-relinking` skill.
