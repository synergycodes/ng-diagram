# ng-diagram config reference (1.4.0)

Every `FlowConfig` key with its default, what it controls, when the diagram reads it, and the skill that covers it. Built from `FlowConfig` in the 1.4.0 typings and the library's default config.

Contents

1. When a key is read
2. Top-level keys
3. `resize`
4. `linking`
5. `danglingEdges`
6. `grouping`
7. `zoom`
8. `edgeRouting`
9. `background`
10. `nodeRotation`
11. `snapping`
12. `selectionMoving`
13. `zIndex`
14. `boxSelection`
15. `virtualization`
16. `shortcuts`
17. `defaultNode`

## 1. When a key is read

- **use**: read from the running config each time the feature runs. `updateConfig()` takes effect at the next use. Values that feed stored results (edge paths, z-indexes) apply to what is computed after the change.
- **signal**: read through `NgDiagramService.config()`, which is `{}` until just after the first `diagramInit` and keeps the previous engine's values during a model swap. Takes effect from `diagramInit` on; `updateConfig()` updates it at once.
- **create**: read when the engine is created (first render, every new model) or when `diagramInit` fires. Change `[config]` and create a new model.
- **binding**: read from the `[config]` binding of `<ng-diagram>` at any time. `updateConfig()` has no effect.

Merging: objects merge key by key; arrays and functions replace the old value; `undefined` is skipped.

## 2. Top-level keys

| Key | Default | Controls | Read | Skill |
| --- | --- | --- | --- | --- |
| `computeNodeId` | `crypto.randomUUID()` (fallback: time + random) | Ids of palette-dropped and pasted nodes | use | `ng-diagram-config` |
| `computeEdgeId` | same | Ids of drawn and pasted edges | use | `ng-diagram-config` |
| `resize` | see 3 | Minimum size, group resizing, default resizable | use; `defaultResizable`: signal | `ng-diagram-resize-rotate-snap` |
| `linking` | see 4 | Drawing edges, validation, edge builders, edge panning, relink default | use; `defaultRelinkable` (handle display): signal | `ng-diagram-linking`, `ng-diagram-edge-relinking` |
| `danglingEdges` (since 1.4.0) | off | Edges with free ends | use | `ng-diagram-dangling-edges` |
| `grouping` | see 6 | Which nodes may join which group | use | `ng-diagram-groups` |
| `zoom` | see 7 | Zoom limits and step, zoom-to-fit defaults | use; `zoomToFit.onInit`: create | `ng-diagram-viewport` |
| `edgeRouting` | see 8 | Default routing and routing options | `defaultRouting`: create; options: use | `ng-diagram-edge-routing` |
| `background` | see 9 | Pattern of `<ng-diagram-background>` | signal | `ng-diagram-styling` |
| `nodeRotation` | see 10 | Rotation snapping, default rotatable | use; `defaultRotatable`: signal | `ng-diagram-resize-rotate-snap` |
| `snapping` | see 11 | Snapping while dragging and resizing | use | `ng-diagram-resize-rotate-snap` |
| `selectionMoving` | see 12 | Edge panning while dragging nodes | use | `ng-diagram-config` |
| `zIndex` | see 13 | Layering of nodes, edges and selection | use | `ng-diagram-layering` |
| `boxSelection` | see 14 | Box selection behavior | use | `ng-diagram-selection-clipboard` |
| `virtualization` (since 1.0.0) | see 15 | Rendering only what is in view | `enabled`: create; others: use | `ng-diagram-performance` |
| `shortcuts` | default list, see 16 | Keyboard, modifier and wheel bindings | use | `ng-diagram-shortcuts` |
| `debugMode` | `false` | Console logging of every committed update and of render timings | use | `ng-diagram-config` |
| `hideWatermark` (since 0.9.0) | unset (shown) | Hides the watermark | binding | `ng-diagram-setup` |
| `watermarkPosition` (since 1.2.0) | unset (`'bottom-right'`) | Watermark corner: `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'` | binding | `ng-diagram-setup` |
| `viewportPanningEnabled` (since 0.9.0) | `true` | User panning (mouse, touch, wheel, arrow keys) and edge panning | use; `grab` cursor: create | `ng-diagram-viewport` |
| `nodeDraggingEnabled` (since 1.0.0) | `true` | Dragging and arrow-key moving of nodes | use | `ng-diagram-custom-nodes` |
| `defaultNode` (since 1.3.0) | unset | Options of the default node template | signal | `ng-diagram-custom-nodes` |

## 3. `resize`

| Key | Default | Meaning |
| --- | --- | --- |
| `getMinNodeSize(node)` | `() => ({ width: 20, height: 20 })` | Smallest size a node can be resized to. |
| `allowResizeBelowChildrenBounds` | `true` | `false`: a group cannot be resized smaller than its children. |
| `defaultResizable` | `true` | Resize handles for nodes without their own `resizable`. |

## 4. `linking`

| Key | Default | Meaning |
| --- | --- | --- |
| `portSnapDistance` | `10` | Distance in flow units (pixels at zoom 1) at which the drawn edge snaps to a port. The TSDoc says "pixels", but the check runs on flow positions. |
| `validateConnection(source, sourcePort, target, targetPort, context?)` | `() => true` | Allows or rejects a connection. Since 1.4.0 `source`/`target` can be `null` (free end) and `context.reason` is `'draw'`, `'relink'` or `'attach'`. |
| `temporaryEdgeDataBuilder(edge)` | returns a copy | Shapes the preview edge shown while drawing or relinking. |
| `finalEdgeDataBuilder(edge)` | returns a copy | Shapes the edge added when a draw ends; it receives the edge with its new id. |
| `edgePanningEnabled` | `true` | Pan the viewport while drawing or relinking near the border. |
| `edgePanningForce` | `10` | Speed multiplier of that panning. |
| `edgePanningThreshold` | `30` | Distance in px from the border that starts panning. |
| `selectNodeOnPortPress` (since 1.2.0) | `true` | `false`: pressing a port starts linking without selecting the node. |
| `defaultRelinkable` (since 1.4.0) | `false` | Default for `edge.relinkable`: `true`, `'source'`, `'target'` or `false`. |

## 5. `danglingEdges`

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `false` | Keep edges drawn onto empty canvas, detach a relinked end dropped there, and enable `detachEdge` and `startLinkingFromPosition`. |
| `shouldKeepOnDrop(edge, dropPosition)` | unset (keep all) | Decide per edge whether a drop on empty canvas keeps it. |
| `detachOnNodeDelete` | `false` | Deleting a node keeps its edges as dangling edges. |
| `shouldDetachOnNodeDelete(edge, deletedNode, end)` | unset | Decide per end; an edge losing both ends survives only if this returns `true` for both. |

## 6. `grouping`

| Key | Default | Meaning |
| --- | --- | --- |
| `canGroup(node, group)` | `() => true` | Whether a dragged node may join a group (also controls the group highlight). |

## 7. `zoom`

| Key | Default | Meaning |
| --- | --- | --- |
| `min` | `0.01` | Smallest scale. |
| `max` | `10` | Largest scale. |
| `step` | `0.03` | Zoom change per wheel step or zoom key press (factor `1 ± step`). |
| `zoomToFit.padding` | `50` | Default padding of `zoomToFit()`: a number, `[v, h]`, `[t, h, b]` or `[t, r, b, l]`. |
| `zoomToFit.onInit` | `false` | Run `zoomToFit` after every initialization. With virtualization it only logs `[ngDiagram] zoomToFit is disabled when virtualization is enabled.` |

## 8. `edgeRouting`

| Key | Default | Meaning |
| --- | --- | --- |
| `defaultRouting` | `'orthogonal'` | Routing of edges without their own `routing`. Read once; at runtime use `NgDiagramService.setDefaultRouting()`. |
| `bezier.bezierControlOffset` | `100` | Control point offset of bezier edges. |
| `orthogonal.firstLastSegmentLength` | `20` | Length of the first and last segment. |
| `orthogonal.maxCornerRadius` | `15` | Largest corner radius. |
| `[routingName]` | none | Options for a custom routing. Every routing receives the whole `edgeRouting` object and reads its own key. |

## 9. `background`

| Key | Default | Meaning |
| --- | --- | --- |
| `dotSpacing` | `30` | Distance between dots (`type="dots"`). |
| `cellSize` | `{ width: 10, height: 10 }` | Minor grid cell (`type="grid"`). |
| `majorLinesFrequency` | `{ x: 5, y: 5 }` | Major grid line every N minor cells. |

## 10. `nodeRotation`

| Key | Default | Meaning |
| --- | --- | --- |
| `shouldSnapForNode(node)` | `() => false` | Snap the angle while rotating. |
| `computeSnapAngleForNode(node)` | `() => null` | Per-node snap angle; `null` uses `defaultSnapAngle`. |
| `defaultSnapAngle` | `30` | Snap step in degrees. |
| `defaultRotatable` | `true` | Rotate handle for nodes without their own `rotatable`. |

## 11. `snapping`

| Key | Default | Meaning |
| --- | --- | --- |
| `shouldSnapDragForNode(node)` | `() => false` | Snap position while dragging. |
| `shouldSnapResizeForNode(node)` | `() => false` | Snap size while resizing. |
| `computeSnapForNodeDrag(node)` | `() => null` | Per-node drag grid; `null` uses `defaultDragSnap`. |
| `computeSnapForNodeSize(node)` | `() => null` | Per-node resize grid; `null` uses `defaultResizeSnap`. |
| `computeSnapOffsetForNodeSize(node)` (since 1.3.0) | `() => null` | Per-node resize offset; `null` uses `defaultResizeSnapOffset`. |
| `defaultDragSnap` | `{ width: 10, height: 10 }` | Drag grid. |
| `defaultResizeSnap` | `{ width: 10, height: 10 }` | Resize grid. |
| `defaultResizeSnapOffset` (since 1.3.0) | `{ width: 0, height: 0 }` | Sizes snap to `offset + n * snap` per axis. |

## 12. `selectionMoving`

| Key | Default | Meaning |
| --- | --- | --- |
| `edgePanningEnabled` | `true` | Pan while dragging nodes near the border (also needs `viewportPanningEnabled`). |
| `edgePanningForce` | `10` | Speed multiplier. |
| `edgePanningThreshold` | `30` | Distance in px from the border that starts panning; also the margin kept around nodes moved with the arrow keys. |

## 13. `zIndex`

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `true` | Run the z-index assignment. |
| `selectedZIndex` | `10000` (before 1.2.3: `1000`) | Added to selected elements. |
| `temporaryEdgeZIndex` | `2147483647` (before 1.2.3: `1000`) | z-index of the edge being drawn. |
| `edgesAboveConnectedNodes` | `false` | Draw edges above the nodes they connect. |
| `elevateOnSelection` | `true` | Add `selectedZIndex` to selected elements. |

## 14. `boxSelection`

| Key | Default | Meaning |
| --- | --- | --- |
| `partialInclusion` | `true` | Select nodes that are only partly inside the box. |
| `realtime` | `true` | Update the selection while the box is drawn; `false` selects on release. |

## 15. `virtualization`

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `false` | Render only elements in and near the viewport. Set up when the engine is created: change it with `[config]` plus a new model, not `updateConfig()` (the diagram ends up half switched). |
| `padding` | `0.5` | Extra area around the viewport, as a share of its larger side. |
| `idleDelay` | `100` | Milliseconds after panning stops before the rendered set is updated. |

## 16. `shortcuts`

Default actions: `copy`, `cut`, `paste`, `deleteSelection`, `cancelInteraction` (Escape), `keyboardMoveSelectionUp/Down/Left/Right`, `keyboardPanUp/Down/Left/Right`, `boxSelection` (Shift), `multiSelection`, `selectAll`, `undo`, `redo`, `zoom` (modifier + wheel), `keyboardZoomIn`, `keyboardZoomOut`. The array replaces the defaults when passed directly: build it with `configureShortcuts(changes)`; an action with `bindings: []` is turned off. Details: `ng-diagram-shortcuts`.

## 17. `defaultNode`

| Key | Default | Meaning |
| --- | --- | --- |
| `removePorts` (since 1.3.0) | unset (ports shown) | `true` removes `port-left`/`port-right` from the default node template. The `removeDefaultPorts` input of `ng-diagram-base-node-template` overrides it per template. |
