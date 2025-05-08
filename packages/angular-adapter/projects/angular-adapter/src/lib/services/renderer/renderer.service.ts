import { Injectable, signal } from '@angular/core';
import { Edge, Metadata, Node, Renderer, Viewport } from '@angularflow/core';

@Injectable({ providedIn: 'root' })
export class RendererService implements Renderer {
  nodes = signal<Node[]>([]);
  edges = signal<Edge[]>([]);
  viewport = signal<Viewport>({
    x: 0,
    y: 0,
    scale: 1,
  });
  temporaryEdge = signal<Edge | null>(null);

  draw(nodes: Node[], edges: Edge[], metadata: Metadata): void {
    this.nodes.set(nodes);
    this.edges.set(edges);
    this.viewport.set(metadata.viewport);
    this.temporaryEdge.set(metadata.temporaryEdge ?? null);
  }
}
