# Tree and org-chart layout with expand/collapse

Based on the docs example "Expand/Collapse Subtree" (https://www.ngdiagram.dev/docs/examples/expand-collapse/, since 1.4.0) and the Org Chart template (https://github.com/synergycodes/ng-diagram-orgchart). Collapsing uses the model `hidden` flag (since 1.4.0); see `ng-diagram-visibility` for its rules.

## Tree layout, root pinned (tree-layout.ts)

Positions only: the edges stay `routingMode: 'auto'`, so ng-diagram routes them between the moved nodes.

```typescript
import ELK, { type ElkNode } from 'elkjs';
import { type Edge, type Node, type Point } from 'ng-diagram';

const elk = new ELK();

export async function treeLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'DOWN' | 'RIGHT' = 'DOWN'
): Promise<{ id: string; position: Point }[]> {
  const graph: ElkNode = {
    id: 'root',
    layoutOptions: { 'elk.algorithm': 'mrtree', 'elk.direction': direction, 'spacing.nodeNode': '80' },
    children: nodes.map(({ id, size }) => ({ id, width: size?.width ?? 0, height: size?.height ?? 0 })),
    edges: edges.map(({ id, source, target }) => ({ id, sources: [source], targets: [target] })),
  };
  const { children = [] } = await elk.layout(graph);
  const placed = new Map(children.map((child) => [child.id, child]));
  const updates = nodes.map(({ id, position }) => ({
    id,
    position: { x: placed.get(id)?.x ?? position.x, y: placed.get(id)?.y ?? position.y },
  }));

  // Pin the root (no incoming edge) to its current place so the tree does not jump on re-layout
  const targets = new Set(edges.map((edge) => edge.target));
  const root = nodes.find((node) => !targets.has(node.id));
  const laidOutRoot = updates.find((update) => update.id === root?.id);
  if (!root || !laidOutRoot) return updates;
  const dx = root.position.x - laidOutRoot.position.x;
  const dy = root.position.y - laidOutRoot.position.y;
  return updates.map(({ id, position }) => ({ id, position: { x: position.x + dx, y: position.y + dy } }));
}
```

## Collapse and expand (tree.service.ts)

Compute the layout of the tree as it will look after the toggle first. Then commit the `collapsed` data flag, the `hidden` flags of the subtree and the new positions in one transaction, so nodes that appear are drawn at their final place right away. Edges to hidden nodes hide automatically.

```typescript
interface TreeNodeData {
  label: string;
  collapsed?: boolean;
}

@Injectable()
export class TreeService {
  private readonly diagram = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);

  /** Collapses or expands the subtree below `nodeId` and lays out the nodes that stay visible. */
  async toggle(nodeId: string): Promise<void> {
    const node = this.modelService.getNodeById<TreeNodeData>(nodeId);
    if (!node) return;
    const collapsed = !node.data.collapsed;
    const subtree = this.subtree(nodeId);

    // Lay out the tree as it will look after the toggle
    const model = this.modelService.getModel();
    const visible = model.getNodes().filter((n) => (subtree.has(n.id) ? !collapsed : !n.computedHidden));
    const ids = new Set(visible.map((n) => n.id));
    const positions = await treeLayout(visible, model.getEdges().filter((e) => ids.has(e.source) && ids.has(e.target)));

    // Flag, hidden state and positions in one commit: nodes that appear are drawn at their final place
    await this.diagram.transaction(() => {
      this.modelService.updateNodeData<TreeNodeData>(nodeId, { ...node.data, collapsed });
      this.modelService.updateNodes([...subtree].map((id) => ({ id, hidden: collapsed })));
      this.modelService.updateNodes(positions);
    });
  }

  /** Descendants of `nodeId`; a collapsed child is included, its own subtree stays closed. */
  private subtree(nodeId: string): Set<string> {
    const result = new Set<string>();
    const stack = [nodeId];
    while (stack.length > 0) {
      const parentId = stack.pop()!;
      for (const edge of this.modelService.getConnectedEdges(parentId)) {
        const childId = edge.target;
        // Outgoing edges only; skip free ends (''), a cycle back to the start, and nodes already seen
        if (edge.source !== parentId || childId === '' || childId === nodeId || result.has(childId)) continue;
        result.add(childId);
        if (!this.modelService.getNodeById<TreeNodeData>(childId)?.data.collapsed) stack.push(childId);
      }
    }
    return result;
  }
}
```

## Notes

- First layout: run it in `(diagramInit)`, then `await zoomToFit()`, and keep the wrapper `visibility: hidden` until then. In the docs example every node starts at `(0, 0)` and visible, so all of them are measured; subtrees marked `collapsed` in the data are hidden in the same transaction as that first layout.
- A node that is already `hidden` in the initial model is never measured, so the layout has no size for it after it is expanded. Give such nodes a `size` in the data.
- Re-run the layout after structure changes: `(edgeDrawEnded)` with `success`, `(selectionRemoved)` with deleted edges or nodes, and after your own add/delete calls.
- The Org Chart template also uses one uniform node size for all layout runs (the largest measured size) so the spacing stays stable when node content changes, and the `elk.direction` option to switch between top-down (`'DOWN'`) and left-to-right (`'RIGHT'`) charts.
- Groups (compound nodes) are not covered by these examples. If your tree contains groups, lay out top-level nodes only and move each group's descendants with it, as the `LayoutService` in SKILL.md does.
