---
name: ng-diagram-visibility
description: Use when hiding or showing ng-diagram nodes, edges, ports or labels (hidden flag, computedHidden, ngDiagramHidden, port/label [hidden]), expand/collapse of groups or trees, filtering the diagram, or CSS display:none delaying init.
license: Apache-2.0
---

# Conditional visibility

Hiding elements without removing them (since 1.4.0): the model `hidden` flag, the `ngDiagramHidden` directive, and the `hidden` inputs of ports and edge labels; expand/collapse and filtering. Group basics are in `ng-diagram-groups`, port details in `ng-diagram-ports`, edge label templates in `ng-diagram-custom-edges`.

## Rules

- **Pick the tool by where the state lives.**
  - `hidden` flag on nodes and edges (model data): the main tool for expand/collapse, filters and anything you save. One `updateNodes` call hides any number of elements, and it works with virtualization.
  - `[ngDiagramHidden]` inside a node or edge template: UI state you do not want in the model. Not supported with virtualization.
  - `[hidden]` on `ng-diagram-port` and `ng-diagram-base-edge-label`: ports and labels are declared in templates, so they have no model flag. They hide independently of their node or edge.
- **Do not hide diagram elements with plain CSS `display: none`.** The library cannot tell a CSS-hidden element from one that is not measured yet: initialization waits for the measurement timeouts (2 to 4 s), and features such as box selection, `zoomToFit` and linking do not know that the element is hidden.
- **`computedHidden` is the effective state** (read-only, set by the library, not saved). A node is hidden when its own flag or binding is set or any ancestor group is hidden; an edge when its own flag or binding is set or either endpoint node is hidden. Read it; never write it.
- **Hiding is not deleting, deselecting or moving.** A hidden element keeps its data, size, position and `selected` flag.
- **Targeted programmatic calls do not skip hidden elements.** `select`, `centerOnNode`, `bringToFront`/`sendToBack`, group APIs, `updateNode` and `moveNodesBy` work on them; it is your choice whether to call them. User interactions and the whole-selection or whole-diagram APIs (`deleteSelection`, `copy`/`cut`, `zoomToFit`, `computePartsBounds`, `startLinking`, `attachEdge`) skip them.

## Hide and show with the hidden flag

```typescript
// In a component or service: modelService = inject(NgDiagramModelService), selectionService = inject(NgDiagramSelectionService)
async hideNodes(ids: string[]): Promise<void> {
  await this.modelService.updateNodes(ids.map((id) => ({ id, hidden: true }))); // their edges hide too
}

async hideEdge(edgeId: string): Promise<void> {
  await this.modelService.updateEdge(edgeId, { hidden: true });
}

isShown(nodeId: string): boolean {
  // computedHidden also covers a hidden ancestor group and template bindings
  return !this.modelService.getNodeById(nodeId)?.computedHidden;
}

// Hiding does not deselect; deselect yourself when it matters to your UI
async hideAndDeselect(ids: string[]): Promise<void> {
  await this.modelService.updateNodes(ids.map((id) => ({ id, hidden: true })));
  await this.selectionService.deselect(ids);
}
```

The flag counts only when it is exactly `true`. `hidden` can also be set in the initial model.

## What hiding does

- In the default render mode the element stays in the DOM with `display: none`. It keeps its geometry, never blocks initialization or `waitForMeasurements`, and is measured again when shown. Visible nodes, edges and labels get no inline `display`, so your CSS keeps control of them.
- User interactions ignore effectively hidden elements: clicks, `selectAll`, box selection, keyboard moves, dragging, linking (starting a link from a hidden node is ignored with a console warning), `zoomToFit`, `computePartsBounds`, the minimap, edge routing and the resize limits of their group.
- A hidden but selected element cannot be moved, and `deleteSelection` and `copy` skip it. Deleting a visible group still deletes its hidden children, and deleting a node still removes its hidden edges.
- Hidden children move with their group when the user drags it, so they reappear in place.
- A node that is hidden from the start has no measured `size` until it is shown.

## Hide from the template with ngDiagramHidden

```typescript
import { Component, Injectable, inject, input, signal } from '@angular/core';
import { NgDiagramHiddenDirective, type NgDiagramNodeTemplate, type Node } from 'ng-diagram';

interface TaskData { title: string; done: boolean; }

@Injectable({ providedIn: 'root' })
export class TaskFilterService {
  readonly hideDone = signal(false); // toggled from a toolbar outside the diagram
}

@Component({
  selector: 'app-task-node',
  imports: [NgDiagramHiddenDirective],
  styles: `:host { display: block; }`,
  template: `
    <!-- hides the whole node (and its edges), not just this div -->
    <div class="task" [ngDiagramHidden]="filter.hideDone() && node().data.done">{{ node().data.title }}</div>
  `,
})
export class TaskNodeComponent implements NgDiagramNodeTemplate<TaskData> {
  readonly filter = inject(TaskFilterService);
  node = input.required<Node<TaskData>>();
}
```

- Selector `[ngDiagramHidden]` (since 1.4.0). A bare `ngDiagramHidden` attribute means hidden. Place it on any element of a node or edge template; it hides the owner node or edge.
- The model flag, the binding and a hidden ancestor all add up: any of them hides the element, so `hidden: false` in the model does not undo a binding.
- A hidden node cannot be clicked, so the control that shows it again must live outside the node (a toolbar, a service).
- Bindings that change in the same change detection cycle are processed together, but for many elements the model flag is cheaper.

## Ports and edge labels

```html
<ng-diagram-port id="out" type="source" side="right" [hidden]="!editMode()" />
<ng-diagram-base-edge-label [id]="'label'" [positionOnEdge]="0.5" [hidden]="!showLabels()">...</ng-diagram-base-edge-label>
```

A hidden port cannot start or receive a link and the linking preview does not snap to it. Edges connected to a hidden port stay visible at the port's last measured position — hide them with their own flag if needed. A port hidden from its first render has no position yet, so its edges are not drawn until it has been shown once: render ports visible during initialization and hide them in `(diagramInit)` (recipe in `ng-diagram-ports`).

## Expand/collapse

Group: hide the direct children and shrink the group to a header; keep the group itself visible.

```typescript
// The group stays visible as a header bar; its direct children are hidden.
async toggleGroup(groupId: string): Promise<void> {
  const group = this.modelService.getNodeById<LaneData>(groupId);
  if (!group) return;
  const collapsed = !group.data.collapsed;
  const childIds = this.modelService.getChildren(groupId).map((n) => n.id);

  await this.diagramService.transaction(() => {
    // Direct children are enough: their descendants and all their edges follow.
    // A nested group keeps its own children's flags, so it stays collapsed or expanded.
    void this.modelService.updateNodes(childIds.map((id) => ({ id, hidden: collapsed })));
    void this.modelService.updateNode(groupId, {
      autoSize: false,
      size: collapsed ? { width: 200, height: 48 } : (group.data.expandedSize ?? { width: 300, height: 200 }),
      data: { ...group.data, collapsed, expandedSize: collapsed ? group.size : undefined },
    });
  });
}
```

- Tree: collect the nodes below the toggled node through outgoing edges, stop below children that are collapsed themselves, and hide them in one `updateNodes` call; edges into hidden nodes hide automatically. Skip free ends (`edge.target !== ''`): `getConnectedEdges` groups the free ends of dangling edges under the id `''`.
- A `resize.getMinNodeSize` larger than the header keeps a collapsed group bigger (it is applied as CSS); see the reference for a collapsed-aware minimum.
- Edges from a hidden node to a visible one are hidden too. To keep such connections visible while a group is collapsed, point the inner end at the group (docs example "Expand/Collapse Groups").

Read `references/expand-collapse.md` for the scaffolding (`LaneData`, injected services), the tree-branch recipe with a cycle guard, and layout notes.

## Filter by type or data

```typescript
// Untyped nodes count as 'default'. Hiding a group also hides everything inside it.
async showOnlyTypes(types: ReadonlySet<string>): Promise<void> {
  const updates: { id: string; hidden: boolean }[] = [];
  for (const node of this.modelService.getModel().getNodes()) {
    const hidden = !types.has(node.type ?? 'default');
    if ((node.hidden ?? false) !== hidden) {
      updates.push({ id: node.id, hidden }); // send only real changes
    }
  }
  await this.modelService.updateNodes(updates);
}
```

Filtering by `data` works the same way: compute `hidden` from the fields you need. To filter edges, use `updateEdges` with `hidden`; edges of hidden nodes are already hidden.

## Choosing a pattern

| Pattern | Element exists? | Effect |
| --- | --- | --- |
| `hidden` flag / directive / input | Yes, `display: none` | No init delay, ignored by interactions, measured again when shown. Use for anything that toggles. |
| `@if` in your template (content or ports) | No | Never measured. A removed port leaves `measuredPorts`, and edges that still name it stop following the node (see `ng-diagram-ports`). |
| Deleting from the model | No | Data is gone; edges of deleted nodes are deleted. |
| CSS `display: none` | Yes | Avoid: init waits 2 to 4 s, interactions still see the element. |

## Virtualization, clipboard, persistence

- With virtualization, hidden elements are removed from the DOM instead of kept with `display: none`; their geometry stays in the model. `ngDiagramHidden` is ignored there (console warning) — use the model flag. Port and label `[hidden]` inputs keep working.
- Copy and cut take the hidden descendants of a copied group (a collapsed group is copied with its content), skip selected elements that are hidden themselves, and pasted hidden content is not selected (since 1.4.0). See `ng-diagram-selection-clipboard`.
- `hidden` is saved by `toJSON()` and kept by `initializeModel`; `computedHidden` is removed. See `ng-diagram-persistence`.
- Upgrade note (1.4.0): `hidden` became a library property. If your data already used a top-level `hidden: true` on nodes or edges for something else, those elements are hidden after the upgrade — rename your property. `data.hidden` is not read by the library.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Every load takes 2 to 4 s; console: `[InitUpdater] Measurement timeout reached. Some entities may not be measurable (e.g., display: none)...` or `[DiagramInitEmitter] Measurement timeout reached from last measurement. Emitting diagramInit event anyway...` | Something is hidden with CSS. Use the `hidden` flag, `[ngDiagramHidden]` or the port/label `[hidden]` input. (Also check that the model comes from `initializeModel`; see `ng-diagram-model-init`.) |
| `[ngDiagram] ngDiagramHidden is not supported with virtualization enabled and is ignored — ...` | Use the model `hidden` flag with virtualization. |
| `[ngDiagram] ngDiagramHidden must be used inside a node or edge template — the binding is ignored.` | The directive sits outside a node/edge template (for example in a palette). |
| `[ngDiagram] startLinking ignored: source node "<id>" is missing or effectively hidden.` (from `NgDiagramService.startLinking`) or `... is effectively hidden.` | A link was started from a hidden node; show it first. |
| Hidden nodes still count in the selection panel; Delete does not remove them | Hiding does not deselect, and `deleteSelection` skips hidden elements. Deselect when hiding. |
| Edge stays visible after hiding a port | By design: hide the edge with its own `hidden` flag. |
| Box selection or `zoomToFit` includes "invisible" nodes | They are hidden with CSS. Use the flag. |
| Expanded nodes have no size for the layout | They were hidden from the start and never measured. Start visible and hide after `diagramInit`, or set `size`. |
| Collapsed group's children reappear away from the group on expand | The group was moved from code without them (`updateNode` and `moveNodesBy` move only what you pass; user drags take hidden children along). Move the descendants together with the group (see `ng-diagram-groups`). |
| Elements disappeared after upgrading to 1.4.0 | Your data sets `hidden: true` at node/edge level. Rename that property. |
| Edges attached to `[hidden]` ports are not drawn at all | The ports were hidden from their first render and never measured. Show them during initialization, hide them in `(diagramInit)`. |
| After hiding with CSS `display: none`, a node's `size` (or port/label geometry) became 0 × 0 (before 1.4.0) | Fixed in 1.4.0 — upgrade, and hide with the `hidden` flag or inputs. |
| `hidden` set but the element shows | The value is not the boolean `true` (for example the string `"true"`). |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
