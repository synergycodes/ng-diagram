# Middleware context, helpers and action types (ng-diagram 1.4.0)

Read this when a middleware needs more than `helpers.anyNodesAdded()` and `modelActionTypes.includes(...)`: the full `MiddlewareContext`, every helper, and which user action or API call produces which action type.

## Contents

1. `MiddlewareContext` fields
2. `MiddlewareHelpers`
3. `FlowStateUpdate` (what `next()` accepts)
4. Action types and where they come from

## 1. `MiddlewareContext`

| Field | Meaning |
| --- | --- |
| `state` | `{ nodes, edges, metadata }` with this update and all earlier middlewares applied. Rebuilt for each middleware; prefer the maps for lookups. |
| `nodesMap`, `edgesMap` | The same current state as `Map<id, element>`. `nodesMap.size` is the node count after this update. |
| `initialState` | The committed state before this update. |
| `initialNodesMap`, `initialEdgesMap` | The committed elements by id; use them to read elements that this update removes. |
| `initialConnectedEdgesMap` | `Map<nodeId, edgeId[]>` of the committed edges per node (since 1.2.3). |
| `modelActionTypes` | Action types of this update: one entry for a single call; for a transaction, the transaction name followed by the action types of its queued changes, each type once (see section 4). |
| `modelActionType` | Deprecated: the first entry of `modelActionTypes`. |
| `helpers` | Change-inspection functions (section 2). |
| `history` | `{ name, stateUpdate }[]`: what each earlier middleware passed to `next()` in this update. |
| `initialUpdate` | The `FlowStateUpdate` that started this update. Middlewares may add more; use `helpers` for the full picture. |
| `config` | The current diagram configuration. |
| `environment` | Environment info (browser, rendering engine, ...). |
| `actionStateManager`, `edgeRoutingManager` | Library internals for gesture state and routings; read-only use. |

## 2. `MiddlewareHelpers`

All helpers report the cumulative changes of this update: the initial change plus everything earlier middlewares added.

| Helper | Returns |
| --- | --- |
| `anyNodesAdded()`, `anyNodesRemoved()`, `anyEdgesAdded()`, `anyEdgesRemoved()` | `boolean` |
| `checkIfNodeAdded(id)`, `checkIfNodeRemoved(id)`, `checkIfEdgeAdded(id)`, `checkIfEdgeRemoved(id)` | `boolean` |
| `checkIfNodeChanged(id)`, `checkIfEdgeChanged(id)` | `true` when any property of that element changed |
| `checkIfAnyNodePropsChanged(props)`, `checkIfAnyEdgePropsChanged(props)` | `true` when any element changed one of the given properties, e.g. `['position', 'size']` |
| `getAffectedNodeIds(props)`, `getAffectedEdgeIds(props)` | ids of elements that changed one of the given properties |
| `getChangedNodeIds()`, `getChangedEdgeIds()` | ids of all changed elements (since 1.2.2) |
| `getAddedNodes()`, `getAddedEdges()` | the added elements as they are now |
| `getRemovedNodes()`, `getRemovedEdges()` | the removed elements as they were before |

A property counts as changed only when its value differs. Node `position`/`size` and edge `sourcePosition`/`targetPosition` are compared by value, every other property by reference (a new `data` object counts as changed, the same object does not).

## 3. `FlowStateUpdate`

```ts
interface FlowStateUpdate {
  nodesToAdd?: Node[];
  nodesToUpdate?: (Partial<Node> & { id: string })[];
  nodesToRemove?: string[];
  edgesToAdd?: Edge[];
  edgesToUpdate?: (Partial<Edge> & { id: string })[];
  edgesToRemove?: string[];
  metadataUpdate?: Partial<Metadata>;
}
```

What you pass to `next()` is applied on top of the current state in this order: add nodes, add edges, remove edges, remove nodes, update nodes, update edges, merge metadata (shallow). An entry in `nodesToAdd`/`edgesToAdd` with an existing id replaces the whole element, so change added elements with `nodesToUpdate`/`edgesToUpdate` patches. Updates for ids that do not exist are ignored.

## 4. Action types

`ModelActionType` is a string union. `modelActionTypes` is typed as `LooseAutocomplete<ModelActionType>[]`, so it can also hold other strings; in 1.4.0 these are `'transaction'`, `'updateEdges'`, `'updateViewportSize'`, `'zoomToFit'`, `'centerOnNode'` and `'centerOnRect'`. Added to the union in 1.3.0: `'cancelResize'`, `'cancelRotate'`, `'cancelDrag'`. Added in 1.4.0: `'startLinkingFromPosition'`, `'startRelinking'`, `'finishRelinking'`, `'templateVisibilityChange'`. An exhaustive `switch` over `ModelActionType` breaks on upgrades; use a `Set` or `includes()` and pass everything else through.

| Action type | Produced by |
| --- | --- |
| `init` | The first update after a model is loaded. Never cancel it. |
| `transaction` | First entry of every `NgDiagramService.transaction()` update; the queued action types follow. |
| `addNodes`, `addEdges`, `updateNode`, `updateEdge`, `updateEdges`, `deleteNodes`, `deleteEdges` | The matching `NgDiagramModelService` methods (`updateNodeData` → `updateNode`, `updateEdgeData` → `updateEdge`). |
| `updateNodes` | `NgDiagramModelService.updateNodes`, group membership changes (`addToGroup`/`removeFromGroup`, dropping a node on a group) and node size measurements after initialization. |
| `updateNode` | Also: `NgDiagramNodeService.resizeNode` on a node without `size`, and the geometry restore of a cancelled resize or rotation (inside the `cancelResize`/`cancelRotate` transaction). |
| `updateEdge` | Also: `ng-diagram-base-edge` writing its `routing`, `routingMode` or `points` inputs to the model. |
| `addPortsBulk`, `updatePortsBulk`, `deletePortsBulk` | Port measurement. Never cancel. |
| `addEdgeLabelsBulk`, `updateEdgeLabelsBulk`, `deleteEdgeLabelsBulk` | Edge label measurement. Never cancel. |
| `templateVisibilityChange` | `[ngDiagramHidden]` on node and edge templates (1.4.0). Port and label `hidden` inputs do not run an update. |
| `updateViewportSize` | The `<ng-diagram>` element changed size (window resize, layout change); writes the viewport width/height. Not in the union. Never cancel. |
| `changeSelection` | Clicking, box selection, select all, `NgDiagramSelectionService.select`/`deselect`/`deselectAll`. |
| `selectEnd` | End of a selection gesture, and after paste (empty update; drives `selectionGestureEnded`). |
| `moveNodesStart`, `moveNodesStop` | Start and end of a node drag (empty updates). |
| `moveNodes` | Name of the transaction around each drag step; it contains `moveNodesBy`. |
| `moveNodesBy` | Each drag step, the final drop step, arrow-key moves, `NgDiagramNodeService.moveNodesBy`. |
| `cancelDrag`, `cancelResize`, `cancelRotate` | Escape / `cancelActiveInteraction()` restoring the geometry (1.3.0). |
| `resizeNodeStart`, `resizeNode`, `resizeNodeStop` | Resize gesture; `resizeNode` also from `NgDiagramNodeService.resizeNode`. |
| `rotateNodeStart`, `rotateNodeTo`, `rotateNodeStop` | Rotation gesture; `rotateNodeTo` also from `NgDiagramNodeService.rotateNodeTo`. |
| `startLinking`, `moveTemporaryEdge`, `finishLinking` | Drawing an edge. `finishLinking` also runs, with an empty update, when a draw is cancelled. |
| `startLinkingFromPosition` | `NgDiagramService.startLinkingFromPosition` (1.4.0). |
| `startRelinking`, `finishRelinking` | Dragging an edge end to reconnect it (1.4.0). |
| `deleteSelection` | Delete shortcut, cut, `NgDiagramSelectionService.deleteSelection`. |
| `paste` | Paste shortcut, `NgDiagramClipboardService.paste`. |
| `paletteDropNode` | Dropping a palette item. |
| `changeZOrder` | `NgDiagramNodeService.bringToFront`/`sendToBack`. |
| `highlightGroup`, `highlightGroupClear` | Drop-target highlight of a group while dragging, and `NgDiagramGroupsService.highlightGroup`/`highlightGroupClear`. |
| `zoom` | Wheel, pinch and keyboard zoom, `NgDiagramViewportService.zoom`/`setViewport`. |
| `moveViewport` | `NgDiagramViewportService.moveViewport`/`moveViewportBy` and keyboard panning. Pointer panning skips the middleware chain. |
| `zoomToFit`, `centerOnNode`, `centerOnRect` | The matching `NgDiagramViewportService` methods (not in the union). |
| `clearModel`, `deleteElements` | In the union; no public 1.4.0 API produces them. |
