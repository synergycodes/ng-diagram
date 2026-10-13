---
name: ng-diagram-groups
description: Use when grouping ng-diagram nodes (isGroup, groupId) - containers, swimlanes, custom group templates, membership by drag and drop or code (canGroup, NgDiagramGroupsService), resizing or deleting groups, or children that move, vanish or overflow.
license: Apache-2.0
---

# Groups

Group nodes and their children: model wiring, custom group templates, membership by drag and drop and from code, resizing, deleting, moving and fitting groups. Collapse/expand is in `ng-diagram-visibility`, z-order in `ng-diagram-layering`, copy/paste in `ng-diagram-selection-clipboard`.

## Rules

- **A group is a node with `isGroup: true`; children point to it with `groupId`.** A custom template alone gives no group behavior — `type` only picks the template.
- **All positions are global** (diagram coordinates), for groups and children alike. Joining or leaving a group never changes a position. Dragging a group moves all its descendants, but moving from code moves only what you pass: `updateNode(groupId, { position })` and `moveNodesBy([group], …)` leave the children in place.
- **Give groups `size` and `autoSize: false`.** Otherwise the default group template is a fixed 9.0625rem square (145 × 145 px at the default font size), and a custom group template takes the size of its content.
- **Change membership through `NgDiagramGroupsService`.** It applies `grouping.canGroup`, prevents cycles and fires `groupMembershipChanged`. Writing `groupId` yourself skips the first two.
- **Deleting a group deletes its whole subtree** — with `deleteSelection` always, with `NgDiagramModelService.deleteNodes` since 1.4.0. To keep the children, remove them from the group first, in a separate awaited call.
- **Groups never resize themselves.** Children can stick out after a move or a group resize; only `resize.allowResizeBelowChildrenBounds: false` stops a resize below the children.

## Model shape

```typescript
import { initializeModel, type GroupNode, type Node } from 'ng-diagram';

export const model = initializeModel({
  nodes: [
    // A group with an explicit size; without size + autoSize: false the default group is a fixed 145 × 145 px box
    { id: 'lane', isGroup: true, position: { x: 0, y: 0 }, size: { width: 500, height: 300 }, autoSize: false, data: {} },
    // Children keep global coordinates
    { id: 'a', groupId: 'lane', position: { x: 40, y: 60 }, data: { label: 'A' } },
    // Nested group
    { id: 'sub', isGroup: true, groupId: 'lane', position: { x: 220, y: 40 }, size: { width: 240, height: 200 }, autoSize: false, data: {} },
    { id: 'b', groupId: 'sub', position: { x: 260, y: 100 }, data: { label: 'B' } },
  ],
});

// Typed arrays: GroupNode requires `highlighted`
export const group: GroupNode = {
  id: 'g2', isGroup: true, highlighted: false, position: { x: 600, y: 0 }, size: { width: 300, height: 200 }, autoSize: false, data: {},
};
export const nodes: Node[] = [group, { id: 'c', groupId: 'g2', position: { x: 640, y: 60 }, data: {} }];

// Narrow the Node union with `in` (`node.isGroup` alone does not compile)
export const isGroupNode = (node: Node): node is GroupNode => 'isGroup' in node && node.isGroup;
```

## Custom group template and config

```typescript
import { Component, input } from '@angular/core';
import {
  NgDiagramGroupHighlightedDirective, NgDiagramNodeResizeAdornmentComponent, NgDiagramNodeSelectedDirective,
  type GroupNode, type GroupingConfig, type NgDiagramConfig, type NgDiagramGroupNodeTemplate, type ResizeConfig,
} from 'ng-diagram';

@Component({
  selector: 'app-lane-group',
  imports: [NgDiagramNodeResizeAdornmentComponent, NgDiagramGroupHighlightedDirective, NgDiagramNodeSelectedDirective],
  styles: `
    :host { display: block; width: 100%; height: 100%; }
    .lane { width: 100%; height: 100%; border: 1px solid #888; border-radius: 8px; }
  `,
  template: `
    <ng-diagram-node-resize-adornment>
      <div class="lane" ngDiagramGroupHighlighted ngDiagramNodeSelected [node]="node()">
        <div class="header">{{ node().data.title }}</div>
      </div>
    </ng-diagram-node-resize-adornment>
  `,
})
export class LaneGroupComponent implements NgDiagramGroupNodeTemplate<{ title: string }> {
  node = input.required<GroupNode<{ title: string }>>();
}

const grouping: Partial<GroupingConfig> = {
  // called for drag-and-drop membership, the drop highlight and addToGroup
  canGroup: (node, group) => group.type === 'lane' && node.type !== 'lane',
};
const resize: Partial<ResizeConfig> = {
  allowResizeBelowChildrenBounds: false, // default true: a group can be resized smaller than its children
  getMinNodeSize: (node) => ('isGroup' in node && node.isGroup ? { width: 200, height: 120 } : { width: 80, height: 40 }),
};
export const config = { grouping, resize } satisfies NgDiagramConfig;
```

- Register the component in the same `NgDiagramNodeTemplateMap` as node templates, set that `type` on the group node, and keep `isGroup: true`.
- Build callback sections with their own type (`Partial<GroupingConfig>`, `Partial<ResizeConfig>`) as above: `NgDiagramConfig` drops callback signatures, so inline parameters are TS7006 under `strict`, and annotated ones still let a wrong return type compile (see `ng-diagram-config`).
- `ngDiagramGroupHighlighted [node]` adds the class `ng-diagram-group-highlight` while `node.highlighted` is `true` (a drag hovers the group). The global styles then draw a highlight border and inset shadow: `--ngd-group-border-color-highlight`, `--ngd-group-box-shadow-color-highlight`, `--ngd-group-highlight-size`.
- The default group template shows no text (it does not read `data`). Use a custom template for a title. Its look: `--ngd-group-border-color`, `--ngd-group-border-color-hover`, `--ngd-group-border-radius`.

## Membership by drag and drop

- On drop, the topmost unselected group under the **pointer** receives the dragged (visible, selected) nodes. When no group is under the pointer, the dropped nodes leave their group, unless their group is part of the drag. How much the node overlaps the group does not matter.
- While dragging, the group under the pointer gets `highlighted: true` when `canGroup` accepts at least one dragged node.
- `grouping.canGroup(node, group)` gets the candidate node first, then the group (default `() => true`). A node rejected on drop keeps its old `groupId`.
- A palette drop never joins a group by itself — see the `onPaletteDrop` recipe below.

## Membership and group operations from code

```typescript
import { Component, inject } from '@angular/core';
import {
  NgDiagramGroupsService, NgDiagramModelService, NgDiagramNodeService, NgDiagramSelectionService,
  type GroupMembershipChangedEvent, type PaletteItemDroppedEvent,
} from 'ng-diagram';

@Component({ selector: 'app-group-toolbar', template: '' })
export class GroupToolbarComponent {
  private readonly groupsService = inject(NgDiagramGroupsService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly nodeService = inject(NgDiagramNodeService);
  private readonly selectionService = inject(NgDiagramSelectionService);

  // Positions stay as they are (global coordinates); canGroup and cycle checks apply.
  async addSelectionTo(groupId: string): Promise<void> {
    const ids = this.selectionService.selection().nodes.map((n) => n.id).filter((id) => id !== groupId);
    await this.groupsService.addToGroup(groupId, ids);
  }

  // deleteNodes deletes the whole subtree (since 1.4.0), so detach the children first.
  // Use two awaited calls, not one transaction: commands in a transaction see the state before it.
  async ungroup(groupId: string): Promise<void> {
    const childIds = this.modelService.getChildren(groupId).map((n) => n.id);
    await this.groupsService.removeFromGroup(groupId, childIds);
    await this.modelService.deleteNodes([groupId]);
  }

  // moveNodesBy moves only the nodes you pass: include the descendants.
  async moveGroup(groupId: string, dx: number, dy: number): Promise<void> {
    const group = this.modelService.getNodeById(groupId);
    if (!group) return;
    await this.nodeService.moveNodesBy([group, ...this.modelService.getChildrenNested(groupId)], { x: dx, y: dy });
  }

  // Groups never grow on their own. Fit around the visible, measured children only:
  // with none, computePartsBounds returns a 0×0 rect at (0, 0).
  async fitToChildren(groupId: string, padding = 24): Promise<void> {
    const children = this.modelService.getChildrenNested(groupId).filter((n) => !n.computedHidden && n.measuredBounds);
    if (children.length === 0) return;
    const bounds = this.modelService.computePartsBounds(children, []);
    await this.modelService.updateNode(groupId, {
      position: { x: bounds.x - padding, y: bounds.y - padding },
      size: { width: bounds.width + 2 * padding, height: bounds.height + 2 * padding },
      autoSize: false,
    });
  }

  // <ng-diagram (paletteItemDropped)="onPaletteDrop($event)" ...>: a palette drop does not join a group by itself
  async onPaletteDrop({ node, dropPosition }: PaletteItemDroppedEvent): Promise<void> {
    const group = this.modelService
      .getNodesInRange(dropPosition, 1)
      .filter((n) => n.id !== node.id && 'isGroup' in n && n.isGroup)
      .sort((a, b) => (b.computedZIndex ?? 0) - (a.computedZIndex ?? 0))[0]; // innermost group first
    if (group) {
      await this.groupsService.addToGroup(group.id, [node.id]);
    }
  }

  // <ng-diagram (groupMembershipChanged)="onMembershipChanged($event)" ...>
  onMembershipChanged({ grouped, ungrouped }: GroupMembershipChangedEvent): void {
    for (const { targetGroup, nodes } of grouped) {
      console.log(`${nodes.length} node(s) added to ${targetGroup.id}`);
    }
    console.log(`${ungrouped.length} node(s) left their group`);
  }
}
```

- `NgDiagramGroupsService`: `addToGroup(groupId, nodeIds)`, `removeFromGroup(groupId, nodeIds)`, `highlightGroup(groupId, nodes)`, `highlightGroupClear()`. All return a `Promise<void>` (since 1.3.0).
- `addToGroup` skips nodes already in that group, nodes that would create a cycle (a group into itself or into its own descendant) and nodes rejected by `canGroup`. It does not check that the target has `isGroup: true`. `removeFromGroup` changes only nodes whose `groupId` is the given id.
- `ungroup` above makes the children top-level. For a nested group, `addToGroup(parentId, childIds)` keeps them in the outer group instead (`canGroup` applies, and a rejected child would be deleted with the group).
- `groupMembershipChanged` (`{ grouped: { nodes, targetGroup }[], ungrouped }`) fires for drag and drop, `addToGroup`/`removeFromGroup` and `updateNodes` that change `groupId` — not for a single `updateNode(id, { groupId })`.
- Queries: `getChildren` (direct), `getChildrenNested` (all descendants), `getParentHierarchy(nodeId)` (closest parent first), `isNestedChild(nodeId, groupId)`.
- `fitToChildren` relies on `computePartsBounds(children, [])`, which uses the children's `measuredBounds`. The filter keeps a collapsed or not yet measured group where it is (without it the group would move to the origin). Before 1.4.0 an empty edge list also pulled the result to the point (0, 0).

## Resizing groups

- With `resize.allowResizeBelowChildrenBounds: false` a group cannot be resized smaller than the box around its visible children. Children count with their `measuredBounds`, so their ports and rotation count too.
- Effectively hidden children never limit the resize (since 1.4.0), so a collapsed group can be resized freely.
- Since 1.3.0: with resize snapping, a group resized from the bottom/right no longer jumps, and a snapped size that would cut children rounds up to the next snap value that still contains them.
- `NgDiagramNodeService.resizeNode` applies the same rules and works on an unselected group since 1.3.0. A resize gesture, or `resizeNode` on a group with visible children, sets `autoSize: false`; for an empty (or collapsed) group pass `disableAutoSize: true`. Handles and snapping: `ng-diagram-resize-rotate-snap`.

## Deleting, copying, hiding and layering

- `deleteSelection` and `deleteNodes` (since 1.4.0) delete all descendants of a deleted group and the edges of every deleted node (with `danglingEdges.detachOnNodeDelete` such edges can stay as dangling edges, see `ng-diagram-dangling-edges`). Before 1.4.0, `deleteNodes` left the children in the model with a `groupId` pointing at a deleted node.
- Copy and cut include all descendants and the edges between the copied nodes (since 1.4.0); before, a pasted group was empty. A node pasted without its group loses `groupId`.
- Collapse a group by hiding its direct children (`hidden: true`); hiding the group itself hides it with everything inside. Hidden children still move with a dragged group. See `ng-diagram-visibility`.
- Children always render above their parent group, whatever their `zOrder` (since 1.2.3). See `ng-diagram-layering`.

## Edge cases

- A `groupId` that points at a missing node or at a node without `isGroup: true` is a model error. `getParentHierarchy` then logs `[ngDiagram] Model integrity error: Node references non-existent parent.` or `[ngDiagram] Model integrity error: Node's parent is not a group.`
- A node with `isGroup: false` and no custom `type` renders with the default group template but is not a group. Leave the key out on non-group nodes (for example when mapping data from a backend).
- Inside a transaction, commands read the state from before the transaction, so "remove from group, then delete the group" must not be one transaction.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Custom group template renders but nodes do not drop into it | The model node lacks `isGroup: true`. |
| Children did not move with the group | The group was moved from code. Pass the descendants to `moveNodesBy`, or move them yourself. |
| Child positions look offset after joining a group | Positions are global, not relative to the group. |
| Default group stays 145 × 145 px; `size` is ignored | Set `autoSize: false` with `size`. |
| Children stick out after resizing the group | Set `resize.allowResizeBelowChildrenBounds: false`, or fit the group to its children. |
| Group cannot be made smaller | `allowResizeBelowChildrenBounds: false` and the children's `measuredBounds` (ports count), or `getMinNodeSize`. |
| A node does not join the group on drop | `canGroup` returned `false`, the pointer was not over the group, or the group was selected too. |
| A node dropped from the palette onto a group is not a member | Palette drops do not join groups; use the `onPaletteDrop` recipe. |
| Deleting a group also deleted its children | By design (since 1.4.0 also for `deleteNodes`). Call `removeFromGroup` first, in a separate awaited call. |
| `groupMembershipChanged` does not fire | `groupId` was changed with `updateNode`. Use `NgDiagramGroupsService` or `updateNodes`. |
| `Property 'isGroup' does not exist on type 'SimpleNode'` | Narrow with `'isGroup' in node`. |
| `Property 'highlighted' is missing in type ... GroupNode` | Add `highlighted: false` to typed group literals. |
| After `deleteNodes` on a group, children point at a missing group (before 1.4.0) | Fixed in 1.4.0 — upgrade. |
| A pasted group is empty (before 1.4.0) | Fixed in 1.4.0 — upgrade. |
| Group jumps or cuts children when resized with snapping (before 1.3.0) | Fixed in 1.3.0 — upgrade. |
| `resizeNode` on an unselected group does nothing (before 1.3.0) | Fixed in 1.3.0 — upgrade. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
