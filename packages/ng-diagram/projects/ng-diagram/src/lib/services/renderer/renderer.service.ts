import { Injectable, signal } from '@angular/core';
import { Edge, Node, Renderer, Viewport } from '../../../core/src';

@Injectable()
export class RendererService implements Renderer {
  clear(): void {
    throw new Error('Method not implemented.');
  }
  nodes = signal<Node[]>([]);
  edges = signal<Edge[]>([]);
  viewport = signal<Viewport>({
    x: 0,
    y: 0,
    scale: 1,
  });

  draw(nodes: Node[], edges: Edge[], viewport: Viewport): void {
    this.nodes.set(nodes);
    this.edges.set(edges);
    this.viewport.set(viewport);
  }
}
