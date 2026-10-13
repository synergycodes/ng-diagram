---
name: ng-diagram-resize-rotate-snap
description: Use when making ng-diagram nodes resizable or rotatable (adornments, activeSides), setting a minimum size, snapping drag, resize or rotation to a grid, resizing, rotating or moving nodes from code, or when handles or settings seem ignored.
license: Apache-2.0
---

# Resize, rotate and snap

Resize and rotate handles (adornments), their settings, minimum size, snapping of drag/resize/rotation, and the programmatic `resizeNode`/`rotateNodeTo`/`moveNodesBy`. Group-specific resize rules are in `ng-diagram-groups`; event payloads in `ng-diagram-events`.

## Rules

- **Custom templates get handles only through adornments.** Wrap the content in `<ng-diagram-node-resize-adornment>` and add `<ng-diagram-node-rotate-adornment />` next to it. Handles show only on the selected node. The default node has both; the default group template has the resize handles only.
- **Priority chain, highest first:** the node's `resizable`/`rotatable` → the adornment's `[defaultResizable]`/`[defaultRotatable]` → config `resize.defaultResizable`/`nodeRotation.defaultRotatable` (both default `true`). The first level that is set wins. "Config is ignored" almost always means a higher level is set.
- **A rotated node has no resize handles.** The resize adornment hides while `angle` is not 0.
- **Resizing writes `size` and needs `autoSize: false`.** A resize gesture sets `autoSize: false` itself. For `resizeNode` pass `disableAutoSize: true` (4th argument), otherwise an auto-size node keeps its content size on screen.
- **Snapping is off by default.** Each `shouldSnap…ForNode` callback returns `false` until you replace it; the snap sizes alone do not snap anything (but `defaultDragSnap`/`computeSnapForNodeDrag` also set the arrow-key step).
- **Type callback sections.** `NgDiagramConfig` drops callback signatures: build each section with its own type (`const snapping: Partial<SnappingConfig> = { ... }`, likewise `Partial<ResizeConfig>`, `Partial<NodeRotationConfig>`), which types the parameters and checks the return type. Annotating parameters inside `satisfies NgDiagramConfig` types only the body (`ng-diagram-config`).
- **Grid alignment:** use multiples of the same step for `background.cellSize` and the snap sizes.

## Resizable and rotatable custom node

```typescript
import { Component, input } from '@angular/core';
import {
  NgDiagramNodeResizeAdornmentComponent, NgDiagramNodeRotateAdornmentComponent, NgDiagramNodeSelectedDirective,
  type NgDiagramNodeTemplate, type Node,
} from 'ng-diagram';

@Component({
  selector: 'app-shape-node',
  imports: [NgDiagramNodeResizeAdornmentComponent, NgDiagramNodeRotateAdornmentComponent],
  hostDirectives: [{ directive: NgDiagramNodeSelectedDirective, inputs: ['node'] }],
  styles: `:host { display: block; width: 100%; height: 100%; }`,
  template: `
    <ng-diagram-node-rotate-adornment />
    <ng-diagram-node-resize-adornment [activeSides]="['right', 'bottom']">
      <div class="shape">{{ node().data.label }}</div>
    </ng-diagram-node-resize-adornment>
  `,
})
export class ShapeNodeComponent implements NgDiagramNodeTemplate<{ label: string }> {
  node = input.required<Node<{ label: string }>>();
}
```

- `activeSides` (since 1.3.0, type `Side[]`) limits which sides can be dragged. All four lines still render (they are the selection frame), but lines of sides left out are inert and show no resize cursor. A corner handle appears only when both of its sides are listed. `[]` keeps the frame without any resizing. The default node and group templates use all sides.
- For a custom rotate handle, put your SVG or component inside `<ng-diagram-node-rotate-adornment>`; empty content shows the built-in icon.
- The resize adornment host is `position: relative` and fills the node, so ports placed inside it are positioned relative to the node box.

## Resize and rotation config

```typescript
import { type NgDiagramConfig, type NodeRotationConfig, type ResizeConfig } from 'ng-diagram';

const resize: Partial<ResizeConfig> = {
  defaultResizable: true, // default true
  getMinNodeSize: (node) => (node.type === 'note' ? { width: 160, height: 80 } : { width: 40, height: 40 }),
};
const nodeRotation: Partial<NodeRotationConfig> = {
  defaultRotatable: false, // default true
  shouldSnapForNode: () => true, // default () => false
  computeSnapAngleForNode: () => 45, // null → defaultSnapAngle
  defaultSnapAngle: 15, // default 30
};
export const config = { resize, nodeRotation } satisfies NgDiagramConfig;
```

- `getMinNodeSize` (default 20×20) applies to resize gestures and `resizeNode`, and it is also set as CSS `min-width`/`min-height` on fixed-size nodes.
- `resize.allowResizeBelowChildrenBounds` concerns groups: see `ng-diagram-groups`.
- Without rotation snapping, an angle within 2° of 0, 90, 180 or 270 snaps to it.

## Snapping aligned with the grid

```typescript
import { type NgDiagramConfig, type SnappingConfig } from 'ng-diagram';

// Grid cell 20 px; drag positions and resized sizes snap to the same 20 px steps.
const gridSnapping: Partial<SnappingConfig> = {
  shouldSnapDragForNode: () => true, // snapping is off by default
  defaultDragSnap: { width: 20, height: 20 },
  shouldSnapResizeForNode: () => true,
  defaultResizeSnap: { width: 20, height: 20 },
};
export const gridConfig = {
  background: { cellSize: { width: 20, height: 20 } },
  snapping: gridSnapping,
} satisfies NgDiagramConfig;

// A card with a 60 px header: heights snap to 60, 110, 160, ... (offset + n * snap, since 1.3.0)
const snapping: Partial<SnappingConfig> = {
  shouldSnapResizeForNode: (node) => node.type === 'card',
  computeSnapForNodeSize: (node) => (node.type === 'card' ? { width: 10, height: 50 } : null),
  computeSnapOffsetForNodeSize: (node) => (node.type === 'card' ? { width: 0, height: 60 } : null),
};
export const headerSnapConfig = { snapping } satisfies NgDiagramConfig;
```

```html
<ng-diagram [model]="model" [config]="gridConfig"><ng-diagram-background type="grid" /></ng-diagram>
```

- Keys and defaults: `shouldSnapDragForNode` / `shouldSnapResizeForNode` (`() => false`), `computeSnapForNodeDrag` / `computeSnapForNodeSize` / `computeSnapOffsetForNodeSize` (`() => null`, null falls back to the default), `defaultDragSnap` and `defaultResizeSnap` (`{ width: 10, height: 10 }`), `defaultResizeSnapOffset` (`{ width: 0, height: 0 }`, since 1.3.0). The resize key is `computeSnapForNodeSize`; there is no `computeSnapForNodeResize`.
- Drag snapping rounds the node position (top-left corner) to the step. Children of a dragged group move by the group's snapped delta and are not snapped on their own.
- Drag snapping also applies to palette drops and paste (since 1.2.0), arrow-key moves and `moveNodesBy` — not to `addNodes` or `updateNode`.
- Arrow keys move the selection by the drag snap step (`computeSnapForNodeDrag` → `defaultDragSnap`, 10 px by default), also when drag snapping is off.
- Resize snapping changes only the sides being dragged, keeps the opposite side in place, and then applies the minimum size.
- To switch snapping at runtime, call `NgDiagramService.updateConfig({ snapping: { shouldSnapDragForNode: () => true } })` — the `[config]` binding is read only when the model is initialized. Or read a signal inside the callbacks: they run on every move and resize step.

## Programmatic resize, rotate and move

```typescript
import { Component, inject } from '@angular/core';
import {
  initializeModel, NgDiagramComponent, NgDiagramModelService, NgDiagramNodeService, provideNgDiagram,
  type NodeResizeEndedEvent,
} from 'ng-diagram';

@Component({
  selector: 'app-diagram',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `<ng-diagram [model]="model" (nodeResizeEnded)="onResizeEnded($event)" />`,
})
export class DiagramComponent {
  private readonly nodeService = inject(NgDiagramNodeService);
  private readonly modelService = inject(NgDiagramModelService);

  model = initializeModel({ nodes: [{ id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Box' } }] });

  async makeWide(nodeId: string): Promise<void> {
    // 4th argument disableAutoSize: true sets autoSize: false, so the new size is applied
    await this.nodeService.resizeNode(nodeId, { width: 400, height: 120 }, undefined, true);
  }

  async rotateRight(nodeId: string): Promise<void> {
    const node = this.modelService.getNodeById(nodeId);
    if (!node) return;
    await this.nodeService.rotateNodeTo(nodeId, (node.angle ?? 0) + 90); // normalized to 0-360
  }

  async moveDown(nodeId: string): Promise<void> {
    const node = this.modelService.getNodeById(nodeId);
    if (!node) return;
    // Pass the descendants too: moveNodesBy moves only the nodes you pass.
    const nodes = [node, ...this.modelService.getChildrenNested(nodeId)];
    await this.nodeService.moveNodesBy(nodes, { x: 0, y: 40 });
  }

  // A size corrected in nodeResizeEnded is kept (since 1.3.0)
  async onResizeEnded({ node, cancelReason }: NodeResizeEndedEvent): Promise<void> {
    if (cancelReason || !node.size) return;
    const width = Math.min(node.size.width, 600);
    const height = Math.min(node.size.height, 400);
    if (width !== node.size.width || height !== node.size.height) {
      await this.nodeService.resizeNode(node.id, { width, height });
    }
  }
}
```

- `resizeNode(id, size, position?, disableAutoSize?, options?)`: applies the minimum size, resize snapping and the group children rules. It does nothing when the size is unchanged (then `position` and `disableAutoSize` are ignored too; use `updateNode` to move a node or to set `autoSize: false`), ignores `resizable`, and resizes an unselected group since 1.3.0. `options` is `{ waitForMeasurements?: boolean }` (since 1.3.0). A node without any `size` only gets the size, without minimum or snapping.
- `rotateNodeTo(id, angle)`: normalizes to 0–360 and applies rotation snapping (or the 2° snap to right angles). It ignores `rotatable`.
- `moveNodesBy(nodes, delta)` takes node objects, moves only those, and computes the new position from the `position` of the objects you pass. Pass fresh objects (`getNodeById`, `getChildrenNested`), not ones read from the `nodes()`/`selection()` signals right after another update. With drag snapping on, the target position is snapped, so a delta smaller than half a step does not move the node.
- Programmatic calls fire `nodeResized`, `selectionRotated` and `selectionMoved` like gestures do; the `…Started`/`…Ended` events fire only for gestures.
- For a hard limit during the gesture (not only after it), use a middleware (see `ng-diagram-middleware`).

## Events and cancel

- Resize: `nodeResizeStarted`, `nodeResized` (on every change), `nodeResizeEnded`. Rotate: `nodeRotateStarted`, `selectionRotated` (on every change), `nodeRotateEnded`. The Started/Ended pairs exist since 1.1.0.
- Escape (the `cancelInteraction` shortcut) or `NgDiagramService.cancelActiveInteraction()` (both since 1.3.0) abort the gesture and restore the previous size, position and `autoSize`, or the previous angle. `nodeResizeEnded`/`nodeRotateEnded` then carry `cancelReason: 'cancelled'`.

## Styling the handles

- Resize handle: `--ngd-resize-handle-size`, `--ngd-resize-handle-background-color`, `--ngd-resize-handle-border-size`, `--ngd-resize-handle-border-style`, `--ngd-resize-handle-border-color`, `--ngd-resize-handle-border-radius`.
- Resize line: `--ngd-resize-line-border-width`, `--ngd-resize-line-border-style`, `--ngd-resize-line-border-color`.
- Rotate handle: `--ngd-rotate-handle-size`, `--ngd-rotate-handle-distance`, `--ngd-rotate-handle-background-color`, `-hover`, `-active`, and the position variables `--ngd-rotate-handle-top`/`-right`/`-bottom`/`-left`.
- The resizing docs page also lists `--ngd-resize-handle-background-color-hover`/`-active` and `--ngd-resize-handle-top`/`-right`/`-bottom`/`-left`; 1.4.0 does not read them.

## Edge cases

- The release position is applied as the last update of a gesture (since 1.3.0), so the `…Ended` event reports where the pointer stopped. Before 1.3.0 a fast release could stop short, up to one snap step.
- A size corrected right after a resize (in `nodeResizeEnded` or a middleware on the resize stop) is kept since 1.3.0, and the node is measured once more after the gesture, so CSS such as `min-width` wins.
- Resizing a group with children and resize snapping: see `ng-diagram-groups` (several 1.3.0 fixes).

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Resize or rotation config seems ignored | A higher priority level is set: node `resizable`/`rotatable` beats the adornment input, which beats the config. |
| No resize handles on a custom node | Content not wrapped in `<ng-diagram-node-resize-adornment>`, node not selected, node rotated, or resizing disabled. |
| Resize handles disappear after rotating | The resize adornment hides while `angle` is not 0. Rotate back to 0 to resize by hand, or call `resizeNode` (it does not check the angle). |
| No rotate handle | `<ng-diagram-node-rotate-adornment />` missing, node not selected, or rotation disabled. |
| Only one corner handle; some sides do not resize | `activeSides` limits them (since 1.3.0). |
| Snapping does nothing | `shouldSnapDragForNode` / `shouldSnapResizeForNode` / `shouldSnapForNode` return `false` by default. |
| Nodes snap, but not onto the grid lines | Grid cell and snap step differ, or the node position was set off-grid by code (`addNodes`/`updateNode` do not snap). |
| `computeSnapForNodeResize` is a type error / has no effect | The key is `computeSnapForNodeSize`. |
| TS7006 "Parameter 'node' implicitly has an 'any' type" in a snapping, resize or rotation callback (docs snippets use `(node) => true`) | Type the section as `Partial<SnappingConfig>` (or `Partial<ResizeConfig>` / `Partial<NodeRotationConfig>`); annotating `(node: Node)` only silences the error. |
| `resizeNode` changes `size` but the node looks the same | `autoSize` is `true`. Pass `disableAutoSize: true` or set `autoSize: false`. |
| `resizeNode` logs `[ngDiagram] Resize node failed: Node not found.` | Wrong id, or the node was deleted first. |
| `moveNodesBy` moved a group but not its children | Pass the descendants too (`getChildrenNested`). |
| `moveNodesBy` with a small delta does nothing | Drag snapping rounds the position back. |
| `rotateNodeTo(id, 1)` keeps the angle at 0 | The 2° snap to right angles (or rotation snapping). |
| Node cannot be made smaller | `resize.getMinNodeSize` (default 20×20) or CSS min sizes. |
| Node stops short of where the pointer was released (before 1.3.0) | Fixed in 1.3.0 — upgrade. |
| Size corrected after a resize is overwritten (before 1.3.0) | Fixed in 1.3.0 — upgrade. |
| Escape does not cancel a resize or rotation | Cancelling exists since 1.3.0 (`cancelInteraction` shortcut, Escape by default). If you replaced the shortcut list, keep a binding for `cancelInteraction` (see `ng-diagram-shortcuts`). |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
