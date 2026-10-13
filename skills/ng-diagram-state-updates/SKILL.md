---
name: ng-diagram-state-updates
description: Use when ng-diagram code adds, updates, deletes or reads nodes and edges (NgDiagramModelService) - typed data, updateNodeData dropping fields, nodes() stale after await, waitForMeasurements, model queries (getConnectedEdges, getOverlappingNodes).
license: Apache-2.0
---

# State updates and reads (NgDiagramModelService)

How to change and read diagram data from code: create/update/delete, typed `data`, awaiting changes, `waitForMeasurements`, and the query methods. Batching and operation order are in `ng-diagram-transactions`, save/load and custom stores in `ng-diagram-persistence`, validating or blocking changes in `ng-diagram-middleware`.

## Rules

- **Change state only through the services** (`NgDiagramModelService`, `NgDiagramSelectionService`, `NgDiagramGroupsService`, `NgDiagramNodeService`, ...). Do not mutate objects from `nodes()` or `getNodeById()`, and do not call update methods on the model adapter. Changes made through the services run the middleware chain (edge routing, z-index, events); a direct mutation skips it and is not even detected as a change.
- **Every mutating method returns `Promise<void>`** (since 1.3.0; before it returned `void`). It resolves once the change is in the model. `await` it when the next line depends on the change; otherwise write `void this.modelService.addNodes(...)` or ignore the promise.
- **Read fresh state with getters, not signals.** After `await`, `getNodeById`, `getEdgeById`, `getConnectedEdges`, `getChildren` and `getModel().getNodes()` already return the new state. The `nodes()`, `edges()`, `metadata()` signals (and `NgDiagramSelectionService.selection()`) refresh with Angular change detection, so right after an `await` and inside diagram event handlers they can still show the old state. Use the signals in templates, `computed()` and `effect()`.
- **`updateNodeData` / `updateEdgeData` replace `data` completely.** Spread the current data to keep the other fields. `updateNode` / `updateEdge` merge top-level properties, but a nested value (`position`, `size`, `data`) is replaced as a whole.
- **Pass new objects.** A value with the same reference as the current one is not a change, so mutating `node.data` and passing the same object back does nothing.
- **Batch.** `addNodes`, `updateNodes`, `updateEdges`, `deleteNodes` and `deleteEdges` take arrays. Each call is one pass through the whole middleware chain; for mixed operations use one transaction (`ng-diagram-transactions`).
- **Never write system-owned properties** (`measuredPorts`, `measuredBounds`, `measuredLabels`, `computedZIndex`, `computedHidden`, `sourcePosition`/`targetPosition` of connected edge ends). See `references/model-reference.md` in `ng-diagram-fundamentals`.
- **Wait for the engine.** Before `<ng-diagram>` has created its engine, service calls throw `[ngDiagram] Library engine not initialized yet.` Run startup code from `(diagramInit)` or when `NgDiagramService.isInitialized()` is true (`ng-diagram-model-init`).

## Typed data and partial updates

Define the data type once and pass it as the generic (getter generics since 1.2.0). With the generic, the compiler reports a missing required field; without it, a forgotten field is dropped silently at runtime.

```ts
import { Component, inject } from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';

interface TaskData {
  label: string;
  status: 'todo' | 'done';
  owner?: string;
}

@Component({ selector: 'app-task-panel', template: '' })
export class TaskPanelComponent {
  private readonly modelService = inject(NgDiagramModelService);

  async rename(nodeId: string, label: string) {
    const node = this.modelService.getNodeById<TaskData>(nodeId);
    if (!node) return;
    // updateNodeData replaces data: spread it, or status and owner are lost
    await this.modelService.updateNodeData<TaskData>(nodeId, { ...node.data, label });
  }

  lock(nodeId: string) {
    // updateNode merges top-level properties; data is not touched here
    void this.modelService.updateNode(nodeId, { draggable: false, resizable: false });
  }
}
```

Inject the services in the component that declares `provideNgDiagram()` or in a component inside it (see `ng-diagram-setup`). For a properties panel bound to the selection, see `ng-diagram-selection-clipboard`.

## Add a node where the user clicked, then select it

```ts
import { Component, inject } from '@angular/core';
import { NgDiagramModelService, NgDiagramSelectionService, NgDiagramViewportService } from 'ng-diagram';

@Component({ selector: 'app-canvas-menu', template: '' })
export class CanvasMenuComponent {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly viewportService = inject(NgDiagramViewportService);

  async addNodeAt(event: MouseEvent) {
    const position = this.viewportService.clientToFlowPosition({ x: event.clientX, y: event.clientY });
    // crypto.randomUUID needs HTTPS or localhost; use your own id helper otherwise
    const id = crypto.randomUUID();

    await this.modelService.addNodes([{ id, position, data: { label: 'New task' } }]);
    await this.selectionService.select([id]); // replaces the current selection

    return this.modelService.getNodeById(id); // fresh here; nodes() may still be old
  }
}
```

Keep the two awaits separate: `select()` builds its change from the committed model, so inside one transaction it cannot see a node added in the same transaction.

## Wait for measurements, bulk changes, queries

```ts
// Class body; modelService and viewportService are injected as above,
// Node and Point are type imports from 'ng-diagram'.

// Wait until the new nodes are measured, then fit the view
async addAndFit(nodes: Node[]) {
  await this.modelService.addNodes(nodes, { waitForMeasurements: true });
  await this.viewportService.zoomToFit();
}

// One pass for many nodes
async alignLeft(nodeIds: string[]) {
  const nodes = nodeIds
    .map((id) => this.modelService.getNodeById(id))
    .filter((node): node is Node => node !== null);
  const left = Math.min(...nodes.map((node) => node.position.x));

  await this.modelService.updateNodes(nodes.map((node) => ({ id: node.id, position: { x: left, y: node.position.y } })));
}

neighborsOf(nodeId: string) {
  const edges = this.modelService.getConnectedEdges(nodeId);
  const nodes = this.modelService.getConnectedNodes(nodeId);
  return { nodeIds: nodes.map((n) => n.id), edgeIds: edges.map((e) => e.id) };
}

nodeAt(clientPoint: Point) {
  const point = this.viewportService.clientToFlowPosition(clientPoint);
  return this.modelService.getNearestNodeInRange(point, 10); // flow units
}
```

`{ waitForMeasurements: true }` (since 1.3.0) waits only for the elements that this call changes. It exists where a change can trigger measurement: `addNodes`, `addEdges`, `updateNode`, `updateNodes`, `updateNodeData`, `updateEdge`, `updateEdges`, `updateEdgeData`, `NgDiagramNodeService.resizeNode` and `NgDiagramClipboardService.paste`. To add nodes and edges and then fit, put both calls in one transaction with `{ waitForMeasurements: true }` (`ng-diagram-transactions`). Deletes, grouping, rotation, selection and viewport calls have nothing new to measure: awaiting them is enough.

## Query methods

Points and ranges are flow (diagram) coordinates; convert pointer positions with `NgDiagramViewportService.clientToFlowPosition()`. All getters that return nodes or edges take an optional data-type generic.

| Method | Returns |
| --- | --- |
| `getNodeById(id)`, `getEdgeById(id)` | the element or `null` |
| `getConnectedEdges(nodeId)` | edges that have the node as `source` or `target` |
| `getConnectedNodes(nodeId)` | nodes at the other end of those edges (free edge ends are skipped) |
| `getNodeEnds(edgeId)` | `{ source, target }` nodes, or `null` when the edge or either end node is missing (always `null` for a dangling edge) |
| `getChildren(groupId)` / `getChildrenNested(groupId)` | direct children / all descendants |
| `isNestedChild(nodeId, groupId)` | `true` when the node is a descendant at any depth |
| `getParentHierarchy(nodeId)` | parent groups, closest first |
| `getNodesInRange(point, range)` | nodes whose rectangle touches the square `point ± range` |
| `getNearestNodeInRange(point, range)` | the closest of those, or `null` |
| `getNearestPortInRange(point, range)` | a `Port` (it has `nodeId`) or `null`; ports hidden in the template are skipped |
| `getOverlappingNodes(nodeIdOrNode)` | nodes whose rectangle (rotation included) intersects the node; pass a `Node` object to test geometry that is not committed yet, for example in a middleware |
| `computePartsBounds(nodes, edges)` | `Rect` around the nodes' `measuredBounds` (ports and rotation included) and the edges' points and labels |
| `getDanglingEndpoints()`, `getNearestDanglingEndpointInRange()` | free edge ends (since 1.4.0), see `ng-diagram-dangling-edges` |

## Edge cases

- **Deleting nodes** also deletes their connected edges, and deleting a group deletes all its descendants (since 1.4.0; before, children stayed with a `groupId` that pointed at a deleted node). To keep the children, `await` `NgDiagramGroupsService.removeFromGroup(groupId, childIds)` first and then call `deleteNodes`, as two awaited steps and not in one transaction: `deleteNodes` collects the descendants from the committed model when it is called. With `danglingEdges.enabled` and `danglingEdges.detachOnNodeDelete`, connected edges are kept as dangling edges (`ng-diagram-dangling-edges`).
- **Inside a transaction** the returned promise resolves at once and the change is applied when the transaction commits. Calls that look things up (`select`, `deleteNodes`, grouping, `attachEdge`) see the model as it was before the transaction.
- **The `nodes()`, `edges()` and `metadata()` signals are filled only after `diagramInit`**: before that (and still inside the `diagramInit` handler) they hold empty arrays and a default viewport; use the getters there. After a new model is assigned, they keep the previous model's data until its `diagramInit`.
- **No service method changes `metadata.data`** (diagram-level data such as a title). Set it with `initializeModel({ metadata: { data } })` or keep it in your own state (`references/model-reference.md` in `ng-diagram-fundamentals`).
- **`addNodes` / `addEdges` do not check ids.** An element with an id that already exists replaces that element. Generate unique ids.
- **Updates for unknown ids are ignored** without an error.
- **Spatial queries** (`getNodesInRange`, `getNearestNodeInRange`, `getNearestPortInRange`, `getOverlappingNodes`) skip effectively hidden nodes and nodes without a `size` (not measured yet). Their index is refreshed when the model notifies a change, which the default model does with change detection, so right after an `await` they can miss nodes that were just added or moved.
- **`computePartsBounds`** needs measured nodes. When nothing is measured it returns `{ x: 0, y: 0, width: 0, height: 0 }`. Since 1.4.0 hidden elements are left out, and an empty `edges` array no longer pulls the result to the origin.
- **Errors and cancels.** When a middleware throws, the returned promise rejects and the change is dropped (since 1.3.0; before, the diagram stopped applying updates). When a middleware calls `cancel()`, the promise resolves normally and nothing is applied.
- **`waitForMeasurements` inside a transaction** is ignored with the console warning `[ngDiagram] waitForMeasurements is ignored inside a transaction — pass { waitForMeasurements: true } to the transaction itself instead.` The promise settles on its own: elements that produce no new measurement (hidden ones since 1.4.0, or unchanged ones) do not block it.
- **`detachEdge`** does nothing (and logs a warning) unless `danglingEdges.enabled` is set; **`attachEdge`** resolves to `false` when the connection is not valid.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| `nodes()` / `selection()` shows old data right after `await` or in an event handler | Signals refresh with change detection. Read with `getNodeById()` or `getModel().getNodes()`. |
| Other `data` fields disappear after `updateNodeData` | `data` is replaced. Spread `...node.data` and pass the generic so the compiler checks required fields. |
| `updateNodeData()` (or another update) does nothing | The same object was mutated in place and passed back (same reference = no change), the id does not exist, or a middleware cancelled the change. Pass a new object: `{ ...node.data, label }`. |
| Error `[ngDiagram] Library engine not initialized yet.` | A service was used before `<ng-diagram>` created its engine (constructor, `ngOnInit`). Wait for `(diagramInit)` or `isInitialized()`. |
| `zoomToFit()` / `centerOnNode()` ignores new nodes | They are not measured yet. Add them with `{ waitForMeasurements: true }`, then fit. |
| Group children are gone after `deleteNodes([groupId])` | Expected since 1.4.0. `await removeFromGroup(...)` first, then delete: two awaited steps, not one transaction. |
| Children keep a `groupId` of a deleted group | ng-diagram 1.3.x or older; fixed in 1.4.0, upgrade. |
| `await` on a service call never resolves | A middleware awaits a mutating call or never calls `next()`/`cancel()`; see `ng-diagram-middleware`. |
| The diagram stops applying any change after an error in a middleware | ng-diagram older than 1.3.0; fixed in 1.3.0 (the promise rejects instead), upgrade. |
| `getNodesInRange` / `getOverlappingNodes` misses a node just added | The node has no size yet, is hidden, or the spatial index has not caught up (it refreshes with change detection). Add it with `{ waitForMeasurements: true }` before querying; a node that already had a size can be missed until the next change detection. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
