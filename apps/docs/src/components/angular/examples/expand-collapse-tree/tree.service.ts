import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';
import { performLayout } from './perform-layout';
import { type TreeNodeData } from './types';

@Injectable()
export class TreeService {
  private readonly ROOT_ID = 'root';

  private readonly modelService = inject(NgDiagramModelService);

  private readonly collapsedIds = new Set<string>();

  async applyLayout(): Promise<void> {
    const { nodes: positionedNodes, edges: routedEdges } = await performLayout(
      this.modelService.nodes(),
      this.modelService.edges()
    );

    this.modelService.updateNodes(positionedNodes);
    this.modelService.updateEdges(routedEdges);
  }

  async toggle(nodeId: string): Promise<void> {
    this.toggleCollapsed(nodeId);

    const hiddenIds = this.computeHiddenIds();

    this.updateVisibility(hiddenIds);

    await this.layoutVisibleNodes(hiddenIds);
  }

  private toggleCollapsed(nodeId: string): void {
    if (this.collapsedIds.has(nodeId)) {
      this.collapsedIds.delete(nodeId);
    } else {
      this.collapsedIds.add(nodeId);
    }
  }

  private computeHiddenIds(): Set<string> {
    const childrenMap = new Map<string, string[]>();
    for (const { source, target } of this.modelService.edges()) {
      const children = childrenMap.get(source);
      if (children) {
        children.push(target);
      } else {
        childrenMap.set(source, [target]);
      }
    }

    const hiddenIds = new Set<string>();
    const stack = [...this.collapsedIds];

    while (stack.length > 0) {
      const parentId = stack.pop()!;
      for (const childId of childrenMap.get(parentId) ?? []) {
        hiddenIds.add(childId);
        stack.push(childId);
      }
    }

    return hiddenIds;
  }

  private updateVisibility(hiddenIds: Set<string>): void {
    this.modelService.updateNodes(
      this.modelService.nodes().map((n) => ({
        id: n.id,
        data: {
          ...(n.data as TreeNodeData),
          isHidden: hiddenIds.has(n.id),
          collapsed: this.collapsedIds.has(n.id),
        },
      }))
    );

    this.modelService.updateEdges(
      this.modelService.edges().map((e) => ({
        id: e.id,
        data: {
          isHidden: hiddenIds.has(e.source) || hiddenIds.has(e.target),
        },
      }))
    );
  }

  private async layoutVisibleNodes(hiddenIds: Set<string>): Promise<void> {
    const visibleNodes = this.modelService
      .nodes()
      .filter((n) => !hiddenIds.has(n.id));
    const visibleEdges = this.modelService
      .edges()
      .filter((e) => !hiddenIds.has(e.source) && !hiddenIds.has(e.target));

    const rootPosition = this.modelService
      .nodes()
      .find((n) => n.id === this.ROOT_ID)!.position;

    const { nodes: positionedNodes, edges: routedEdges } = await performLayout(
      visibleNodes,
      visibleEdges
    );

    // Offset all positions to keep root node pinned
    const newRootPosition = positionedNodes.find(
      (n) => n.id === this.ROOT_ID
    )!.position;
    const dx = rootPosition.x - newRootPosition.x;
    const dy = rootPosition.y - newRootPosition.y;

    this.modelService.updateNodes(
      positionedNodes.map((n) => ({
        id: n.id,
        position: { x: n.position.x + dx, y: n.position.y + dy },
      }))
    );

    this.modelService.updateEdges(
      routedEdges.map((e) => ({
        id: e.id,
        routingMode: e.routingMode,
        points: e.points?.map((p: any) => ({ x: p.x + dx, y: p.y + dy })),
      }))
    );
  }
}
