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

  private lastNodeCount = 0;

  draw(nodes: Node[], edges: Edge[], viewport: Viewport): void {
    const nodeCountDiff = nodes.length - this.lastNodeCount;

    if (nodeCountDiff > 0) {
      const startTime = performance.now();

      this.nodes.set(nodes);
      this.edges.set(edges);
      this.viewport.set(viewport);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          console.log(
            `[PERF] Render +${nodeCountDiff} nodes (${this.lastNodeCount} -> ${nodes.length}): ${(performance.now() - startTime).toFixed(2)}ms`
          );
        });
      });
    } else {
      this.nodes.set(nodes);
      this.edges.set(edges);
      this.viewport.set(viewport);
    }

    this.lastNodeCount = nodes.length;
  }
}
