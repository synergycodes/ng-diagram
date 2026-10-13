# ng-diagram model reference (1.4.0)

Every property of the model types, who owns it, and what it means. Built from the 1.4.0 type definitions and the code that reads and writes them.

Contents

1. How to read the tables
2. Model
3. SimpleNode
4. GroupNode
5. Edge
6. Port (entries of `node.measuredPorts`)
7. EdgeLabel (entries of `edge.measuredLabels`)
8. Metadata
9. Viewport
10. What `initializeModel()` and `toJSON()` remove

## 1. How to read the tables

- **You**: authored data. Set it when you create the element or with `NgDiagramModelService` (`updateNode`, `updateEdge`, ...). The library only reads it.
- **You + UI**: authored, and user gestures or service commands change it too (drag changes `position`, rotation changes `angle`, ...).
- **Library**: measured or computed. Never write it: your value is overwritten or ignored. Read it after `diagramInit` or after an awaited change.
- **Since**: version that added the property; empty = available since the first public release.
- Objects you read from the model can also carry an internal `_internalId`. Never set it yourself: `initializeModel()` and `toJSON()` remove it, and the library gives every added element a new one.

## 2. Model

`initializeModel(data?: Partial<Model>, injector?, options?)` takes this shape.

| Property | Type | Meaning |
| --- | --- | --- |
| `nodes` | `Node[]` | `Node<T> = SimpleNode<T> \| GroupNode<T>`. |
| `edges` | `Edge[]` | Connections. |
| `metadata` | `Partial<Metadata>` | Viewport and your diagram-level `data`. |

## 3. SimpleNode

`SimpleNode<T extends DataObject = DataObject>` (`DataObject` is `object`)

| Property | Type | Owner | Default | Since | Meaning |
| --- | --- | --- | --- | --- | --- |
| `id` | `string` | You | required | | Unique node id. |
| `position` | `Point` | You + UI | required | | Top-left corner in flow coordinates. Children of a group also use global flow coordinates. |
| `data` | `T` | You | required | | Your data; the library never changes it. Change it with `updateNodeData()`. |
| `type` | `string` | You | unset | | Key in `nodeTemplateMap`. Unset: default node (or default group) template. Unknown key: console warning `[ngDiagram] Node template '<type>' is not registered. Falling back to default node template.` |
| `selected` | `boolean` | You + UI | unset | | Selection state. Change it with `NgDiagramSelectionService`. Removed from nodes by `initializeModel()` and `toJSON()`. |
| `hidden` | `boolean` | You | unset (visible) | 1.4.0 | Hides the node (and its descendants and connected edges) without removing it. See `ng-diagram-visibility`. |
| `computedHidden` | `boolean` (readonly) | Library | | 1.4.0 | Effective visibility: own `hidden`, a template binding, or a hidden ancestor group. |
| `size` | `Size` | You + UI, or Library | unset | | With `autoSize: false`: you set it, it becomes the element's width and height, resizing updates it. With `autoSize` (default): measured from the DOM, do not set it. In both modes a measured DOM size that differs (for example a CSS `min-width`) is written back. |
| `autoSize` | `boolean` | You + UI | `true` | | `true`: size follows the content. Set `false` together with `size` for a fixed size. A resize gesture, and `resizeNode(id, size, position, true)`, sets it to `false`. |
| `zOrder` | `number` | You + UI | unset | | Stacking order among siblings; set by `bringToFront`/`sendToBack` too. See `ng-diagram-layering`. |
| `computedZIndex` | `number` (readonly) | Library | | | Final CSS z-index from `zOrder`, group nesting and selection. |
| `measuredPorts` | `Port[]` (readonly) | Library | | | Ports declared by `<ng-diagram-port>` in the node template, with measured geometry. |
| `resizable` | `boolean` | You | unset | | Shows the handles of `ng-diagram-node-resize-adornment` (part of the default template) when the node is selected. Unset: the adornment's `defaultResizable` input, then `resize.defaultResizable` (`true`). The handles are hidden while `angle` is not 0. |
| `rotatable` | `boolean` | You | unset | | Same for the rotate handle of `ng-diagram-node-rotate-adornment`; fallback `nodeRotation.defaultRotatable` (`true`). |
| `draggable` | `boolean` | You | `true` | 1.0.0 | `false` blocks dragging and arrow-key moves of this node. `nodeDraggingEnabled: false` blocks all nodes. |
| `angle` | `number` | You + UI | unset (0) | | Rotation in degrees, 0 to 360. |
| `groupId` | `string` | You + UI | unset | | Id of the parent group. Dragging into or out of a group changes it. See `ng-diagram-groups`. |
| `measuredBounds` | `Rect` | Library | | | Bounding box with ports and rotation. Not marked `readonly` in the type, but never write it. |

Upgrade note: `hidden` is a library property since 1.4.0. Data that already stored `hidden: true` on nodes or edges hides those elements after the upgrade.

## 4. GroupNode

`GroupNode<T>` has every `SimpleNode` property plus:

| Property | Type | Owner | Meaning |
| --- | --- | --- | --- |
| `isGroup` | `true` | You | Marks the node as a group. Leave the property out on normal nodes: the default template picks the group look when the property exists. |
| `highlighted` | `boolean` | Library | `true` while dragged nodes are over the group and `grouping.canGroup` allows them. Not needed in `initializeModel()` data or other `Node` literals; a literal typed as `GroupNode` needs `highlighted: false` because the type marks it required. |

## 5. Edge

`Edge<T extends DataObject = DataObject>`

| Property | Type | Owner | Default | Since | Meaning |
| --- | --- | --- | --- | --- | --- |
| `id` | `string` | You | required | | Unique edge id. |
| `source` | `string` | You + UI | required | | Source node id. `''` = free (dangling) end, positioned by `sourcePosition`. See `ng-diagram-dangling-edges`. |
| `target` | `string` | You + UI | required | | Target node id; `''` = free end. |
| `data` | `T` | You | required | | Your data. Change it with `updateEdgeData()`. |
| `sourcePort` | `string` | You + UI | unset | | Port id on the source node. Unset with a node id: floating edge attached to the node border. Unset on a free end. |
| `targetPort` | `string` | You + UI | unset | | Same for the target. |
| `points` | `Point[]` | Library (auto) / You (manual) | unset | | Path points. `routingMode: 'auto'`: computed by routing. `'manual'`: you provide them. |
| `routing` | `EdgeRoutingName` | You | `edgeRouting.defaultRouting` (`'orthogonal'`) | | `'orthogonal'`, `'bezier'`, `'polyline'` or a registered custom routing. See `ng-diagram-edge-routing`. |
| `routingMode` | `'auto' \| 'manual'` | You | `'auto'` | | Who owns `points`. |
| `sourcePosition` | `Point` | Library / You (free end) | | | Start point in flow coordinates. Computed for a connected end. You set it only when `source` is `''`. |
| `targetPosition` | `Point` | Library / You (free end) | | | Same for the target end. |
| `selected` | `boolean` | You + UI | unset | | Selection state. Change it with `NgDiagramSelectionService`. Kept by `toJSON()`. |
| `hidden` | `boolean` | You | unset (visible) | 1.4.0 | Hides the edge. |
| `computedHidden` | `boolean` (readonly) | Library | | 1.4.0 | Effective visibility: own `hidden`, a template binding, or a hidden endpoint node. |
| `relinkable` | `boolean \| 'source' \| 'target'` | You | `linking.defaultRelinkable` (`false`) | 1.4.0 | Which ends the user may drag to another port. See `ng-diagram-edge-relinking`. |
| `type` | `string` | You | unset | | Key in `edgeTemplateMap`. Unknown key: console warning and default edge. |
| `sourceArrowhead` | `string` | You | unset | | Marker id at the start, for example the built-in `'ng-diagram-arrow'`. See `ng-diagram-custom-edges`. |
| `targetArrowhead` | `string` | You | unset | | Marker id at the end. |
| `temporary` | `boolean` | Library | | | `true` only on the preview edge shown while a user draws or relinks. Never set it on model edges. |
| `zOrder` | `number` | You + UI | unset | | Overrides the z-index derived from the connected nodes. |
| `computedZIndex` | `number` (readonly) | Library | | | Final CSS z-index. |
| `measuredLabels` | `EdgeLabel[]` (readonly) | Library | | | Labels declared by `<ng-diagram-base-edge-label>` in the edge template, with measured size and computed position. |

## 6. Port (entries of `node.measuredPorts`)

You do not create `Port` objects. Each `<ng-diagram-port id type side>` in a node template becomes one entry. See `ng-diagram-ports`.

| Property | Type | Owner | Meaning |
| --- | --- | --- | --- |
| `id` | `string` | You (port `id` input) | Unique within the node; edges reference it in `sourcePort`/`targetPort`. Default nodes have `port-left` and `port-right`. |
| `type` | `'source' \| 'target' \| 'both'` | You (port `type` input) | `'source'`: links start here only; `'target'`: links end here only; `'both'`: either. |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | You (port `side` input) | Side of the node the port sits on. Routing uses it, turned by the node's `angle`, as the direction of the edge end. |
| `nodeId` | `string` | Library | Owning node. |
| `position` | `Point` | Library | Measured top-left of the port, relative to the node's `position`. |
| `size` | `Size` | Library | Measured size. |

## 7. EdgeLabel (entries of `edge.measuredLabels`)

You do not create `EdgeLabel` objects. Each `<ng-diagram-base-edge-label id positionOnEdge>` in an edge template becomes one entry. See `ng-diagram-custom-edges`.

| Property | Type | Owner | Since | Meaning |
| --- | --- | --- | --- | --- |
| `id` | `string` | You (label `id` input) | | Unique within the edge. |
| `positionOnEdge` | `EdgeLabelPosition` | You (label input) | px form 1.1.0 | A number from `0` to `1` along the path (`0.5` = middle), or a pixel string: `'30px'` from the source, `'-20px'` from the target. |
| `position` | `Point` | Library | | Label center in flow coordinates, computed by routing. |
| `size` | `Size` | Library | | Measured size. |

## 8. Metadata

| Property | Type | Owner | Meaning |
| --- | --- | --- | --- |
| `viewport` | `Viewport` | You (initial) + UI | Current pan and zoom. Change it with `NgDiagramViewportService`. |
| `data` | `T` | You | Your diagram-level data; saved by `toJSON()`. `NgDiagramModelService` has no method to change metadata in 1.4.0, so set it in `initializeModel({ metadata: { data } })`. |

## 9. Viewport

| Property | Type | Owner | Meaning |
| --- | --- | --- | --- |
| `x`, `y` | `number` | You (initial) + UI | Pan offset in screen pixels: flow point `p` is drawn at `p * scale + (x, y)` from the top-left corner of `<ng-diagram>`. Some TSDoc calls this the viewport center; the code uses it as an offset. |
| `scale` | `number` | You (initial) + UI | Zoom factor, `1` = 100%. User zoom is clamped to `zoom.min`/`zoom.max`. |
| `width`, `height` | `number` | Library | Size of the `<ng-diagram>` element, updated when it resizes. |

## 10. What `initializeModel()` and `toJSON()` remove

The default strip functions (`stripNodeRuntimeProperties`, `stripEdgeRuntimeProperties`, public since 1.3.0) run on every element passed to `initializeModel()`/`initializeModelAdapter()` and in `toJSON()` of the default model:

- Nodes: `selected`, `measuredPorts`, `measuredBounds`, `computedZIndex`, `computedHidden`, `_internalId`.
- Edges: `sourcePosition`, `targetPosition` (kept for a free end, where `source`/`target` is `''`), `measuredLabels`, `computedZIndex`, `computedHidden`, `_internalId`.
- Kept: everything else, including node `size`, edge `points`, edge `selected`, `hidden` and `metadata`.

Replace the strip functions with `InitializeModelOptions` (since 1.3.0, at your own risk): see `ng-diagram-model-init`. Persistence details: `ng-diagram-persistence`.
