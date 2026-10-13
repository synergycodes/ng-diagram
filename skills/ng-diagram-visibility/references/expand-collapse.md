# Expand/collapse recipes (hidden flag)

Two complete recipes, type-checked against ng-diagram 1.4.0: collapsing a group to a header bar, and collapsing a branch of a tree. Both follow the docs examples "Expand/Collapse Groups" and "Expand/Collapse Subtree" (https://www.ngdiagram.dev/docs/examples/), without their extras (edge rerouting, ELK layout).

Both methods live in a component or service with:

```typescript
import { Component, inject } from '@angular/core';
import { NgDiagramModelService, NgDiagramService, type Size } from 'ng-diagram';

interface LaneData { title: string; collapsed?: boolean; expandedSize?: Size; }
interface TreeData { label: string; collapsed?: boolean; }

@Component({ selector: 'app-scaffold', template: '' })
export class Scaffold {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly diagramService = inject(NgDiagramService);
}
```

## Collapse a group to a header bar

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

- Do not hide the group itself: that hides the header too.
- Hidden children keep their positions. They move with the group when the user drags it, and they reappear at the same place inside the group on expand.
- A collapsed group can be resized freely: hidden children do not limit the resize.
- `resize.getMinNodeSize` is applied as CSS `min-width`/`min-height`, so a minimum larger than the header keeps the collapsed group bigger. Return a smaller minimum for collapsed groups, for example `'collapsed' in node.data && node.data.collapsed ? { width: 200, height: 48 } : { width: 200, height: 120 }` (`node.data` is typed `object`, hence the `in` check).
- Edges between a hidden child and a node outside the group are hidden too (one endpoint is hidden). To keep them visible, point their inner end at the group while it is collapsed and restore it on expand — the docs example "Expand/Collapse Groups" shows this, including nested groups collapsed in any order.
- Both updates read the state from before the transaction and do not depend on each other, so one transaction is safe here (one model update, one re-render).

## Collapse a branch of a tree

Children are the targets of a node's outgoing edges. The walk stops at children that are collapsed themselves, so their branches stay hidden when an ancestor expands.

```typescript
/** Targets of the node's outgoing edges. */
private childIds(nodeId: string): string[] {
  return this.modelService
    .getConnectedEdges(nodeId)
    .filter((edge) => edge.source === nodeId && edge.target !== '') // skip free (dangling) ends
    .map((edge) => edge.target);
}

/** All nodes below nodeId, without going below children that are collapsed themselves. */
private branchIds(nodeId: string): Set<string> {
  const ids = new Set<string>();
  const stack = [nodeId];
  while (stack.length > 0) {
    for (const childId of this.childIds(stack.pop()!)) {
      if (childId === nodeId || ids.has(childId)) continue; // cycle guard
      ids.add(childId);
      if (!this.modelService.getNodeById<TreeData>(childId)?.data.collapsed) {
        stack.push(childId);
      }
    }
  }
  return ids;
}

async toggleBranch(nodeId: string): Promise<void> {
  const node = this.modelService.getNodeById<TreeData>(nodeId);
  if (!node) return;
  const collapsed = !node.data.collapsed;
  const ids = this.branchIds(nodeId);

  await this.diagramService.transaction(() => {
    void this.modelService.updateNodeData<TreeData>(nodeId, { ...node.data, collapsed });
    // Edges into hidden nodes hide automatically.
    void this.modelService.updateNodes([...ids].map((id) => ({ id, hidden: collapsed })));
  });
}
```

- In a graph where a node has two parents, collapsing one parent hides the shared node even if the other parent is expanded. Decide the rule your app needs (for example: hide only nodes whose parents are all collapsed).
- Put the toggle button in the node template with `(pointerdown)="$event.stopPropagation()"`, so a click neither selects nor drags the node.
- Skip free ends (`edge.target !== ''`): with dangling edges (1.4.0) `getConnectedEdges` also groups free ends under the id `''`, and walking into `''` would hide unrelated nodes.
- To show the toggle only on nodes with children, read the `edges()` signal in a `computed` (it makes the computed re-run when edges change) and then call `getConnectedEdges`, counting only edges with a connected target (`edge.target !== ''`) — the docs example does this without the free-end check.
- Re-run your layout after a toggle. Read node data through `getModel()` or `getNodeById`: right after an awaited update the `nodes()`/`edges()` signals can still show the previous state. To avoid nodes flashing at old positions, compute the layout of the tree after the toggle first and commit `hidden` together with the positions (`ng-diagram-auto-layout`, `references/tree-layout.md`).
- A node that is hidden in the initial model is not measured until it is shown, so it has no `size` for a layout computed before showing it. Start with all nodes visible and hide the collapsed branches after `diagramInit` (as the docs example does), or give such nodes a `size`.
