import { Injectable, signal } from '@angular/core';
import { Edge, Node, Renderer, Viewport } from '../../../core/src';

@Injectable()
export class RendererService implements Renderer {
  clear(): void {
    throw new Error('Method not implemented.');
  }

  isInitialized = signal<boolean>(false);

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

    // Only log when new nodes are being added (not during panning)
    if (nodeCountDiff > 0) {
      const startTime = performance.now();
      console.log(`[PERF] renderer.draw: adding ${nodeCountDiff} nodes (${this.lastNodeCount} -> ${nodes.length})`);

      this.nodes.set(nodes);
      this.edges.set(edges);
      this.viewport.set(viewport);

      // Measure time until Angular finishes DOM creation (next frame)
      requestAnimationFrame(() => {
        const afterAngularTime = performance.now();
        console.log(`[PERF] Angular DOM created in ${(afterAngularTime - startTime).toFixed(2)}ms`);
      });
    } else {
      this.nodes.set(nodes);
      this.edges.set(edges);
      this.viewport.set(viewport);
    }

    this.lastNodeCount = nodes.length;
  }
}
