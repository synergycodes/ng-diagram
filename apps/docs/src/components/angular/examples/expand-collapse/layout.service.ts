import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService, NgDiagramService } from 'ng-diagram';
import { performLayout } from './perform-layout';
import { type TreeNodeData } from './types';

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
   * Run the ELK tree layout on all visible nodes and edges.
   * The root node is pinned to its current position so the tree
   * doesn't jump after a re-layout.
   */
  async applyLayout(): Promise<void> {
    // Use getModel() to read the latest committed state directly.
    // Signal-based accessors (modelService.nodes/edges) may not yet
    // reflect updates made within the current transaction.
    const model = this.modelService.getModel();
    const visibleNodes = model.getNodes().filter((node) => !node.hidden);
    const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
    const visibleEdges = model
      .getEdges()
      .filter(
        (edge) =>
          visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
      );

    const positionedNodes = await performLayout(visibleNodes, visibleEdges);

    const rootNode = this.findRootNode();
    if (rootNode) {
      // Offset every node so the root stays where it was before layout.
      const newRootPosition = positionedNodes.find(
        (n) => n.id === rootNode.id
      )!.position;
      const dx = rootNode.position.x - newRootPosition.x;
      const dy = rootNode.position.y - newRootPosition.y;

      this.modelService.updateNodes(
        positionedNodes.map((n) => ({
          id: n.id,
          position: { x: n.position.x + dx, y: n.position.y + dy },
        }))
      );
    } else {
      this.modelService.updateNodes(positionedNodes);
    }
  }

  /**
   * Toggle the collapsed state of a node and update the visibility
   * of its subtree. The collapsed flag and the subtree's `hidden` flags
   * are batched in a single transaction, followed by a re-layout.
   */
  async toggleCollapsed(nodeId: string): Promise<void> {
    const node = this.modelService.getNodeById<TreeNodeData>(nodeId);

    if (!node) {
      return;
    }

    const newCollapsed = !node.data.collapsed;
    const subtreeIds = this.computeAvailableSubtreeIds(nodeId);

    // Await the transaction to ensure all updates (collapsed flag +
    // hidden flags) are committed to the model before re-layout reads them.
    await this.diagramService.transaction(async () => {
      this.modelService.updateNodeData<TreeNodeData>(nodeId, {
        ...node.data,
        collapsed: newCollapsed,
      });

      this.updateSubtreeVisibility(
        subtreeIds,
        newCollapsed,
        !newCollapsed ? node.position : undefined
      );
    });

    await this.applyLayout();
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

  /**
   * Set the `hidden` flag on the affected subtree nodes. The edges leading
   * into hidden nodes disappear automatically — an edge is effectively
   * hidden whenever one of its endpoint nodes is hidden.
   */
  private updateSubtreeVisibility(
    subtreeIds: Set<string>,
    hidden: boolean,
    parentPosition?: { x: number; y: number }
  ): void {
    this.modelService.updateNodes(
      [...subtreeIds].map((id) => ({
        id,
        hidden,
        // When expanding, place children at the parent's position so they
        // fan out from it once the layout runs — avoids a visual blink
        // from a stale previous position.
        ...(parentPosition ? { position: parentPosition } : {}),
      }))
    );
  }
}
