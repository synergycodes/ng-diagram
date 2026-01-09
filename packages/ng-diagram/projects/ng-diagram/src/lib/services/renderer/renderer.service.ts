import { Injectable, signal } from '@angular/core';
import { Edge, Node, Renderer, Viewport } from '../../../core/src';

@Injectable()
export class RendererService implements Renderer {
  clear(): void {
    throw new Error('Method not implemented.');
  }

  isInitialized = signal<boolean>(false);
  viewportPannable = signal<boolean>(true);

  nodes = signal<Node[]>([]);
  edges = signal<Edge[]>([]);
  viewport = signal<Viewport>({
    x: 0,
    y: 0,
    scale: 1,
  });

  // Track last references for change detection
  private lastNodes: Node[] = [];
  private lastEdges: Edge[] = [];
  private lastNodeCount = 0;

  draw(nodes: Node[], edges: Edge[], viewport: Viewport): void {
    const prevCount = this.lastNodeCount;
    const currentCount = nodes.length;
    const nodeCountDiff = currentCount - prevCount;

    // Only update signals if data actually changed (reference check)
    if (nodes !== this.lastNodes) {
      this.nodes.set(nodes);
      this.lastNodes = nodes;
    }

    if (edges !== this.lastEdges) {
      this.edges.set(edges);
      this.lastEdges = edges;
    }

    this.viewport.set(viewport);
    this.lastNodeCount = currentCount;

    if (nodeCountDiff > 0) {
      const startTime = performance.now();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          console.log(
            `[PERF] Render +${nodeCountDiff} nodes (${prevCount} -> ${currentCount}): ${(performance.now() - startTime).toFixed(2)}ms`
          );
        });
      });
    }
  }

  /**
   * Fast-path: Updates only the viewport signal.
   * Used during panning/zooming when nodes/edges don't change.
   */
  drawViewportOnly(viewport: Viewport): void {
    this.viewport.set(viewport);
  }
}
