import { Injectable, signal } from '@angular/core';
import { Node, Renderer } from '@angularflow/core';

@Injectable({ providedIn: 'root' })
export class RendererService implements Renderer {
  nodes = signal<Node[]>([]);

  draw(nodes: Node[]): void {
    this.nodes.set(nodes);
  }
}
