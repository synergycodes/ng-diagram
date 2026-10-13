# ng-diagram CSS variables and classes (1.4.0)

Every `--ngd-*` variable shipped in `ng-diagram/styles.css` (with `tokens.css` and `primitives.css`), the per-element `--edge-*` variables, and the CSS classes the library puts on elements. "Read by" names the element whose styles use the variable; a variable that nothing reads has no visible effect.

## Contents

- [Primitives](#primitives)
- [Tokens (light / dark)](#tokens-light--dark)
- [Canvas and background](#canvas-and-background)
- [Nodes and groups](#nodes-and-groups)
- [Selection and group highlight](#selection-and-group-highlight)
- [Ports](#ports)
- [Resize and rotate adornments](#resize-and-rotate-adornments)
- [Box selection](#box-selection)
- [Edges](#edges)
- [Edge labels](#edge-labels)
- [Relink handles](#relink-handles)
- [Minimap and zoom controls](#minimap-and-zoom-controls)
- [Classes and attributes](#classes-and-attributes)
- [Declared but not read, read but not declared](#declared-but-not-read-read-but-not-declared)

## Primitives

`primitives.css`, on `:root` only, so an override applies to both themes.

| Variable | Value |
| --- | --- |
| `--ngd-colors-gray-100` | `#ffffff` |
| `--ngd-colors-gray-200` | `#f7f7f7` |
| `--ngd-colors-gray-300` | `#edeff3` |
| `--ngd-colors-gray-400` | `#d5d8e0` |
| `--ngd-colors-gray-450` | `#c2c0c0` |
| `--ngd-colors-gray-500` | `#6f7480` |
| `--ngd-colors-gray-600` | `#4d5059` |
| `--ngd-colors-gray-650` | `#383a40` |
| `--ngd-colors-gray-700` | `#27282b` |
| `--ngd-colors-gray-800` | `#151516` |
| `--ngd-colors-gray-900-5` / `-20` / `-50` | `rgba(7, 7, 8, 0.05)` / `0.2` / `0.5` |
| `--ngd-colors-acc1-400` | `#a977ff` |
| `--ngd-colors-acc1-500` | `#9140ff` |
| `--ngd-colors-acc1-500-40` / `-50` | `rgba(145, 64, 255, 0.4)` / `0.5` |
| `--ngd-colors-acc1-600` | `#891aff` |
| `--ngd-colors-acc4-500` | `#1096e7` |

## Tokens (light / dark)

`tokens.css`: light values on `:root`, dark values on `html[data-theme='dark']` (more specific than `:root`). Values below are the primitive names without the `--ngd-colors-` prefix.

| Token | Light | Dark | Feeds |
| --- | --- | --- | --- |
| `--ngd-diagram-background-color` | gray-200 | gray-800 | `<ng-diagram>` background |
| `--ngd-txt-primary-default` | gray-800 | gray-100 | default node text, default label text |
| `--ngd-node-bg-primary-default` | gray-100 | gray-700 | default node and default group background |
| `--ngd-node-stroke-primary-default` | gray-400 | gray-600 | `--ngd-node-border-color` |
| `--ngd-node-stroke-primary-hover` | acc1-500 | acc1-400 | `--ngd-node-border-color-hover` |
| `--ngd-ui-stroke-primary-focus` | gray-500 | gray-500 | `--ngd-group-border-color` |
| `--ngd-pt-stroke-primary-default` | gray-600 | gray-200 | `--ngd-group-border-color-hover` |
| `--ngd-focus-ring-node-active` | acc1-500-40 | acc1-500-40 | selection ring |
| `--ngd-node-port-fill-default` / `-fill-active` | gray-100 / acc1-500 | same | port background / hover |
| `--ngd-node-port-stroke-default` / `-stroke-active` | gray-500 / gray-100 | same | port border / hover ring |
| `--ngd-transform-box` | acc4-500 | acc4-500 | resize line and handle border |
| `--ngd-ui-bg-primary-default` | gray-100 | gray-700 | resize handle background |
| `--ngd-button-gray-bg-default` / `-hover` / `-active` | gray-500 / gray-600 / gray-650 | gray-650 / gray-600 / gray-500 | rotate handle |
| `--ngd-edge-handle-fill-default` / `-fill-hover` | gray-100 | gray-650 | relink handle fill |
| `--ngd-edge-handle-fill-drag` | acc1-500 | acc1-400 | relink handle fill while dragged |
| `--ngd-edge-handle-stroke-default` / `-hover` / `-drag` | acc1-500 | acc1-400 | relink handle ring |
| `--ngd-edge-handle-halo-hover` / `-drag` | acc1-500-40 | acc1-500-40 | relink handle halo |
| `--ngd-default-edge-label-bg-primary-default` | gray-100 | gray-700 | default label background |
| `--ngd-background-line-minor-color` | gray-450 | gray-700 | grid minor lines |
| `--ngd-background-line-major-color` | gray-500 | gray-600 | grid major lines |
| `--ngd-minimap-bg-primary-default` | gray-100 | gray-700 | minimap background |
| `--ngd-minimap-stroke-primary-default` | gray-400 | gray-600 | minimap border |
| `--ngd-shadow` | gray-900-20 | gray-900-50 | minimap shadow |
| `--ngd-nav-button-primary-default` | gray-600 | gray-400 | zoom buttons and label |
| `--ngd-nav-button-primary-pressed` | acc1-600 | acc1-500 | zoom button while pressed |
| `--ngd-nav-button-primary-hover` | gray-900-5 | gray-900-5 | zoom button hover background |
| `--ngd-nav-button-primary-disabled` | gray-450 | gray-600 | disabled zoom button |
| `--ngd-ui-bg-tertiary-default`, `--ngd-ui-border-color` | gray-200, gray-300 | gray-800, gray-700 | nothing in the library |

## Canvas and background

| Variable | Default | Read by |
| --- | --- | --- |
| `--ngd-diagram-background-color` | token (above) | `<ng-diagram>` host `background-color` |
| `--ngd-background-dot-color` | `var(--ngd-colors-gray-500)` | dots pattern (hidden at zoom 0.3 or below) |
| `--ngd-background-line-minor-color` / `-major-color` | tokens (above) | grid lines |
| `--ngd-background-line-minor-width` / `-major-width` | `0.5` / `1` | grid lines (unitless, constant on screen) |
| `--ngd-background-line-minor-opacity` / `-major-opacity` | `0.5` / `0.6` | grid lines |

Grid and dot spacing are config values, not CSS: `background.cellSize`, `background.majorLinesFrequency`, `background.dotSpacing`.

## Nodes and groups

| Variable | Default | Read by |
| --- | --- | --- |
| `--ngd-node-border-color` | `var(--ngd-node-stroke-primary-default)` | default node border |
| `--ngd-node-border-color-hover` | `var(--ngd-node-stroke-primary-hover)` | default node border on hover and while selected |
| `--ngd-node-border-radius` | `0.75rem` | default node |
| `--ngd-node-border-size` | `0.0625rem` | default node |
| `--ngd-node-background-color` | `var(--ngd-node-bg-primary-default)` | nothing (use the token) |
| `--ngd-group-border-color` | `var(--ngd-ui-stroke-primary-focus)` | default group border (width fixed at `0.0625rem`) |
| `--ngd-group-border-color-hover` | `var(--ngd-pt-stroke-primary-default)` | default group border on hover |
| `--ngd-group-border-radius` | `0.75rem` | default group |

The default node (`ng-diagram-base-node-template`) reads the tokens `--ngd-node-bg-primary-default` (background) and `--ngd-txt-primary-default` (text) directly; its `0.5rem` padding is fixed. The default group reads `--ngd-node-bg-primary-default` too.

## Selection and group highlight

These apply to elements with `ng-diagram-node-wrapper` plus the state class (added by `NgDiagramNodeSelectedDirective` / `NgDiagramGroupHighlightedDirective`).

| Variable | Default | Used for |
| --- | --- | --- |
| `--ngd-selected-node-box-shadow` | `0 0 0 0.25rem var(--ngd-focus-ring-node-active)` | `box-shadow` of `.ng-diagram-node-selected` |
| `--ngd-group-border-color-highlight` | `var(--ngd-colors-acc1-500)` | `border-color` of `.ng-diagram-group-highlight` |
| `--ngd-group-box-shadow-color-highlight` | `var(--ngd-colors-acc1-500-50)` | inset shadow of `.ng-diagram-group-highlight` |
| `--ngd-group-highlight-size` | `1.25rem` | blur of that inset shadow |
| `--ngd-group-background-color-highlight` | `var(--ngd-colors-gray-400)` | nothing |

## Ports

Owner skill: `ng-diagram-ports`.

| Variable | Default | Notes |
| --- | --- | --- |
| `--ngd-port-size` | `0.25rem` | inner size of a port without custom content (visible size = size + 2 × border = `0.5rem`) |
| `--ngd-port-background-color` | `var(--ngd-node-port-fill-default)` | |
| `--ngd-port-border-color` | `var(--ngd-node-port-stroke-default)` | |
| `--ngd-port-border-size` | `0.125rem` | |
| `--ngd-port-border-radius` | `50%` | a port with custom content sets `0%` on itself |
| `--ngd-port-background-color-hover` | `var(--ngd-node-port-fill-active)` | used by the port hover classes |
| `--ngd-port-border-color-hover` | `var(--ngd-node-port-stroke-active)` | hover ring color |
| `--ngd-port-border-size-hover` | `0.25rem` | hover ring width |

## Resize and rotate adornments

Owner skill: `ng-diagram-resize-rotate-snap`.

| Variable | Default |
| --- | --- |
| `--ngd-resize-line-border-width` / `-style` / `-color` | `0.0625rem` / `solid` / `var(--ngd-transform-box)` |
| `--ngd-resize-handle-size` | `0.375rem` |
| `--ngd-resize-handle-background-color` | `var(--ngd-ui-bg-primary-default)` |
| `--ngd-resize-handle-border-size` / `-style` / `-color` | `0.0625rem` / `solid` / `var(--ngd-transform-box)` |
| `--ngd-resize-handle-border-radius` | `0` |
| `--ngd-rotate-handle-size` | `2rem` |
| `--ngd-rotate-handle-distance` | `2rem` |
| `--ngd-rotate-handle-background-color` / `-hover` / `-active` | `var(--ngd-button-gray-bg-default)` / `-hover` / `-active` |
| `--ngd-rotate-handle-xy` | `calc(-0.7071 * var(--ngd-rotate-handle-distance))` |
| `--ngd-rotate-handle-top` / `-right` | `var(--ngd-rotate-handle-xy)` |
| `--ngd-rotate-handle-bottom` / `-left` | not declared (unset); the handle reads them, so you can set them (and `-top` / `-right` to `auto`) |

The resizing guide also lists `--ngd-resize-handle-background-color-hover`, `--ngd-resize-handle-background-color-active` and `--ngd-resize-handle-top` / `-right` / `-bottom` / `-left`. Nothing reads them in 1.4.0.

## Box selection

| Variable | Default |
| --- | --- |
| `--ngd-box-selection-border-color` | `#961ce7` |
| `--ngd-box-selection-border-size` | `1px` |
| `--ngd-box-selection-background` | `rgba(43, 91, 213, 0.12)` |

## Edges

Owner skills: `ng-diagram-custom-edges`, `ng-diagram-dangling-edges`.

| Variable | Default | Notes |
| --- | --- | --- |
| `--ngd-default-edge-stroke` | `var(--ngd-colors-gray-500)` | default edge; also the fallback of `--edge-stroke` |
| `--ngd-default-edge-stroke-hover` | `var(--ngd-colors-gray-700)` | default edge on hover |
| `--ngd-default-edge-stroke-selected` | `var(--ngd-colors-acc1-500)` | default edge while selected |
| `--edge-stroke` | `var(--ngd-default-edge-stroke)` | per edge, on `ng-diagram-base-edge` or an ancestor |
| `--edge-stroke-width` | `2` | |
| `--edge-stroke-dasharray` | `none` | |
| `--edge-stroke-opacity` | `1` | the default edge uses `0.5` for the edge being drawn |
| `--edge-stroke-transition` | `none` | the default edge uses `stroke 0.1s ease-in-out` |

The `stroke`, `strokeWidth`, `strokeDasharray` and `strokeOpacity` inputs of `ng-diagram-base-edge` win over these variables. The default edge sets `--edge-stroke` on its own `ng-diagram-base-edge.default-edge` element for each state, so to recolor default edges change `--ngd-default-edge-stroke*`, not `--edge-stroke`.

## Edge labels

Owner skill: `ng-diagram-custom-edges`. The chip variables apply to `ng-diagram-default-edge-label` (public since 1.3.0), used by the default edge and usable in custom edge templates.

| Variable | Default |
| --- | --- |
| `--ngd-default-edge-label-background-color` | `var(--ngd-default-edge-label-bg-primary-default)` |
| `--ngd-default-edge-label-color` | `var(--ngd-txt-primary-default)` |
| `--ngd-default-edge-label-border-color` | `var(--ngd-colors-gray-500)` |
| `--edge-label-padding` | `4px 8px` |
| `--edge-label-border-radius` | `4px` |
| `--edge-label-font-size` | `12px` |
| `--edge-label-background-color` | `var(--ngd-default-edge-label-background-color)` |
| `--edge-label-text-color` | `var(--ngd-default-edge-label-color)` |
| `--edge-label-border-width` | `1px` |
| `--edge-label-border-color` | `var(--ngd-default-edge-label-border-color)` |
| `--edge-label-border-transition` | `border-color 0.1s ease-in-out` |
| `--edge-label-border-color-hover` (since 1.3.0) | `--edge-label-border-color`, then `--ngd-default-edge-stroke-hover` |
| `--edge-label-border-color-selected` (since 1.3.0) | `--edge-label-border-color`, then `--ngd-default-edge-stroke-selected` |

## Relink handles

Owner skill: `ng-diagram-edge-relinking`. All since 1.4.0. Set `--ngd-relink-handle-*` for the whole diagram, or `--edge-relink-handle-*` (same suffixes) on one edge element to override it.

| Variable | Default |
| --- | --- |
| `--ngd-relink-handle-size` | `0.75rem` (outer diameter; the ring is inside) |
| `--ngd-relink-handle-stroke-width` | `0.1875rem` |
| `--ngd-relink-handle-halo-size` | `0.25rem` |
| `--ngd-relink-handle-fill` / `-fill-hover` / `-fill-drag` | `var(--ngd-edge-handle-fill-default)` / `-hover` / `-drag` |
| `--ngd-relink-handle-stroke` / `-stroke-hover` / `-stroke-drag` | `var(--ngd-edge-handle-stroke-default)` / `-hover` / `-drag` |
| `--ngd-relink-handle-halo-color-hover` / `-drag` | `var(--ngd-edge-handle-halo-hover)` / `-drag` |

`--ngd-relink-handle-inset-x` / `-y` are set inline by the edge component; do not set them.

## Minimap and zoom controls

Owner skill: `ng-diagram-minimap`.

| Variable | Default | Read by |
| --- | --- | --- |
| `--ngd-minimap-background` | `var(--ngd-minimap-bg-primary-default)` | panel background |
| `--ngd-minimap-border-color` | `var(--ngd-minimap-stroke-primary-default)` | panel border (`1px`) |
| `--ngd-minimap-shadow-color` | `var(--ngd-shadow)` | panel shadow |
| `--ngd-minimap-border-radius` | `1rem` | panel |
| `--ngd-minimap-padding` | `0.5rem` | panel padding and gap |
| `--ngd-minimap-margin` | `1rem` | distance from the container corner |
| `--ngd-minimap-node-color` | `var(--ngd-colors-gray-400)` | default minimap node fill |
| `--ngd-minimap-node-opacity` | `0.8` | default minimap node |
| `--ngd-minimap-diagram-bounds-color` / `-opacity` | `var(--ngd-colors-gray-400)` / `0.3` | content outline, shown only with virtualization |
| `--ngd-minimap-viewport-stroke-color` | `var(--ngd-colors-gray-400)` | visible-area rectangle |
| `--ngd-minimap-viewport-stroke-width` | `1` | visible-area rectangle (live); the inner padding derived from it is read once, when the minimap is created |
| `--ngd-nav-button-color` | `var(--ngd-nav-button-primary-default)` | zoom buttons |
| `--ngd-nav-button-size` / `-border-radius` / `-padding` | `1.25rem` / `0.5rem` / `0.6875rem` | zoom buttons |
| `--ngd-nav-button-background-color-hover` | `var(--ngd-nav-button-primary-hover)` | zoom buttons |
| `--ngd-nav-button-color-active` / `-color-disabled` | `var(--ngd-nav-button-primary-pressed)` / `-disabled` | zoom buttons |
| `--ngd-zoom-controls-font-size` / `-font-weight` / `-color` | `0.8125rem` / `500` / `var(--ngd-nav-button-primary-default)` | zoom percentage label |

## Classes and attributes

| Hook | Element | When |
| --- | --- | --- |
| `pannable`, `panning` | `<ng-diagram>` | viewport panning enabled / a pan is running (cursor; not documented) |
| `linking`, `relinking` | `<ng-diagram>` | an edge is drawn or relinked / an edge end is dragged (cursor; not documented) |
| `ng-diagram-node`, `data-node-id` | node wrapper `ng-diagram-node` | always; inline `z-index` from `computedZIndex`, inline `display: none` when effectively hidden |
| `ng-diagram-node-wrapper` + `ng-diagram-node-selected` | element with `ngDiagramNodeSelected` | wrapper always, state while `node.selected` |
| `ng-diagram-node-wrapper` + `ng-diagram-group-highlight` | element with `ngDiagramGroupHighlighted` | wrapper always, state while `group.highlighted` |
| `ng-diagram-port-hoverable`, `ng-diagram-port-hoverable-over-node` | your node host or wrapper | you add them (the base node template adds the second) |
| `ng-diagram-port`, `left`/`right`/`top`/`bottom`, `origin-<point>`, `custom-content`, `data-port-id` | `ng-diagram-port` | always; inline `display` (block or none) |
| `node`, `isSelected` | default node inner element | `isSelected` while selected |
| `ng-diagram-group`, `highlight` | default group inner element | `highlight` while highlighted |
| `ng-diagram-edge--temporary`, `ng-diagram-edge--dangling` (since 1.4.0) | edge wrapper `ng-diagram-edge` (`data-edge-id`) | preview edge / edge with a free end; inline `display: none` when hidden |
| `selected`, `temporary`, `dangling` (`dangling` since 1.4.0) | `ng-diagram-base-edge` and its `ng-diagram-edge__path` | edge state; inline `z-index` on the base edge |
| `default-edge`, `ng-diagram-default-label` | default edge's base edge / label host | always |
| `ng-diagram-default-edge-label`, `selected` | default label chip | `selected` while the edge is selected |
| `ng-diagram-edge__relink-handle` (`--dragging`), `-circle`, `-halo`, `-hit`, `data-relink-handle` | relink handle SVG | selected relinkable edge |
| `ng-diagram-rotate-handle`, `rotate-handle`, `data-rotating` | rotate handle | `rotate-handle` without custom content; `data-rotating` during rotation |
| `resize-line resize-line--<side>` (`--inactive`), `resize-handle resize-handle--<corner>` | resize adornment | always while shown |

## Declared but not read, read but not declared

- Declared, read by nothing: `--ngd-node-background-color`, `--ngd-group-background-color-highlight`, `--ngd-ui-bg-tertiary-default`, `--ngd-ui-border-color`.
- Read, not declared (unset by default): `--ngd-rotate-handle-bottom`, `--ngd-rotate-handle-left`, all `--edge-*` variables (they use fallbacks), `--ngd-relink-handle-inset-x` / `-y` (internal).
