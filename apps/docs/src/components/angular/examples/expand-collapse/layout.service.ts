import { inject, Injectable } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramService,
  type Point,
  type Size,
} from 'ng-diagram';
import { performLayout } from './perform-layout';
import { type TreeNodeData } from './types';

/** A node position update addressed by node id. */
interface PositionUpdate {
  id: string;
  position: Point;
}

/**
 * Manages tree layout and expand/collapse behaviour.
 *
 * Uses ELK.js (via `performLayout`) to position visible nodes in a
 * top-down tree. Hidden nodes (inside collapsed subtrees) are excluded
 * from the layout pass so the tree stays compact.
 */
@Injectable()
export class LayoutService {
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);

  /**
   * Run the ELK tree layout on all visible nodes and edges and commit
   * the new positions.
   */
  async applyLayout(): Promise<void> {
    const positionUpdates = await this.computeLayout(this.visibleNodeIds());
    await this.modelService.updateNodes(positionUpdates);
  }

  /**
   * Toggle the collapsed state of a node's subtree.
   *
   * The layout of the tree as it will look after the toggle is computed
   * first. The collapsed flag, the subtree's `hidden` flags and every new
   * position are then committed in a single transaction, so nodes that
   * appear are rendered at their final position right away.
   */
  async toggleCollapsed(nodeId: string): Promise<void> {
    const node = this.modelService.getNodeById<TreeNodeData>(nodeId);

    if (!node) {
      return;
    }

    const collapsed = !node.data.collapsed;
    const subtreeIds = this.computeAvailableSubtreeIds(nodeId);

    const visibleIds = this.visibleNodeIds();
    for (const id of subtreeIds) {
      if (collapsed) {
        visibleIds.delete(id);
      } else {
        visibleIds.add(id);
      }
    }

    // A node shown for the first time has no measured size yet (hidden
    // nodes render as display: none). It takes the toggled node's size —
    // every tree node uses the same template.
    const positionUpdates = await this.computeLayout(visibleIds, node.size);

    await this.diagramService.transaction(() => {
      this.modelService.updateNodeData<TreeNodeData>(nodeId, {
        ...node.data,
        collapsed,
      });

      // The edges leading into hidden nodes disappear automatically — an
      // edge is effectively hidden whenever one of its endpoint nodes is.
      this.modelService.updateNodes(
        [...subtreeIds].map((id) => ({ id, hidden: collapsed }))
      );

      this.modelService.updateNodes(positionUpdates);
    });
  }

  /**
   * Compute tree positions for the given nodes and the edges between them.
   * The root node is pinned to its current position so the tree doesn't
   * jump after a re-layout.
   */
  private async computeLayout(
    nodeIds: Set<string>,
    fallbackSize?: Size
  ): Promise<PositionUpdate[]> {
    // Read through getModel(): right after an awaited update the
    // nodes()/edges() signals may not have refreshed yet.
    const model = this.modelService.getModel();
    const nodes = model
      .getNodes()
      .filter((node) => nodeIds.has(node.id))
      .map((node) => ({ ...node, size: node.size ?? fallbackSize }));
    const edges = model
      .getEdges()
      .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

    const positionedNodes = await performLayout(nodes, edges);

    // Offset every node so the root stays where it was before layout.
    const rootNode = this.findRootNode();
    const positionedRoot = positionedNodes.find((n) => n.id === rootNode?.id);
    const dx =
      rootNode && positionedRoot
        ? rootNode.position.x - positionedRoot.position.x
        : 0;
    const dy =
      rootNode && positionedRoot
        ? rootNode.position.y - positionedRoot.position.y
        : 0;

    return positionedNodes.map((n) => ({
      id: n.id,
      position: { x: n.position.x + dx, y: n.position.y + dy },
    }));
  }

  /** Ids of the nodes that are currently shown. */
  private visibleNodeIds(): Set<string> {
    return new Set(
      this.modelService
        .getModel()
        .getNodes()
        .filter((node) => !node.hidden)
        .map((node) => node.id)
    );
  }

  /**
   * Find the tree root — the node that is never a target of any edge.
   */
  private findRootNode() {
    const targetIds = new Set(
      this.modelService
        .getModel()
        .getEdges()
        .map((e) => e.target)
    );
    return (
      this.modelService
        .getModel()
        .getNodes()
        .find((n) => !targetIds.has(n.id)) ?? null
    );
  }

  /**
   * Walk the subtree starting from `nodeId`, collecting descendant IDs.
   * Stops descending into children that are themselves collapsed, so
   * their subtrees remain hidden when expanding a parent.
   */
  private computeAvailableSubtreeIds(nodeId: string): Set<string> {
    const childrenIds = new Set<string>();
    const stack = [nodeId];

    while (stack.length > 0) {
      const parentId = stack.pop()!;
      for (const edge of this.modelService.getConnectedEdges(parentId)) {
        if (edge.source === parentId) {
          childrenIds.add(edge.target);

          const child = this.modelService.getNodeById<TreeNodeData>(
            edge.target
          );
          if (!child?.data.collapsed) {
            stack.push(edge.target);
          }
        }
      }
    }

    return childrenIds;
  }
}
