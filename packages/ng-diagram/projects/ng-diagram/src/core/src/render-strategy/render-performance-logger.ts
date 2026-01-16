import type { Node } from '../types';

export class RenderPerformanceLogger {
  private lastVisibleNodeIds: Set<string> | null = null;

  withPerformanceLogging(drawFn: () => void, nodes: Node[], enabled: boolean): void {
    if (!enabled) {
      drawFn();
      return;
    }

    const { added, removed, total } = this.calculateNodeDiff(nodes);
    const shouldLog = added > 0 || removed > 0;

    const startTime = performance.now();
    drawFn();

    if (shouldLog) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          console.log(
            `[ngDiagram] Render: +${added} -${removed} nodes (total: ${total}): ${(performance.now() - startTime).toFixed(2)}ms`
          );
        });
      });
    }
  }

  private calculateNodeDiff(nodes: Node[]): { added: number; removed: number; total: number } {
    const currentNodeIds = new Set(nodes.map((n) => n.id));
    const prevNodeIds = this.lastVisibleNodeIds ?? new Set<string>();

    let added = 0;
    let removed = 0;

    for (const id of currentNodeIds) {
      if (!prevNodeIds.has(id)) added++;
    }
    for (const id of prevNodeIds) {
      if (!currentNodeIds.has(id)) removed++;
    }

    this.lastVisibleNodeIds = currentNodeIds;

    return { added, removed, total: currentNodeIds.size };
  }
}
