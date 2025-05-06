import { Injectable, signal } from '@angular/core';
import { Edge, Node, Renderer } from '@angularflow/core';

@Injectable({ providedIn: 'root' })
export class RendererService implements Renderer {
  nodes = signal<Node[]>([]);
  edges = signal<Edge[]>([]);

  draw(nodes: Node[], edges: Edge[]): void {
    this.nodes.set(nodes);
    this.edges.set(edges);
  }
}
