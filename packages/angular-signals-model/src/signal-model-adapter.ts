import { Injectable, effect, signal } from '@angular/core';
import type { Edge, Metadata, ModelAdapter, Node } from '@angularflow/core';
import { TREE_LAYOUT_DEFAULT_CONFIG } from '@angularflow/core/src/middleware-manager/middlewares/tree-layout/constants';

@Injectable()
export class SignalModelAdapter implements ModelAdapter {
  // Internal state signals
  private nodes = signal<Node[]>([]);
  private edges = signal<Edge[]>([]);
  private metadata = signal<Metadata>({
    viewport: { x: 0, y: 0, scale: 1 },
    layoutConfiguration: { tree: TREE_LAYOUT_DEFAULT_CONFIG },
  });
  private callbacks: ((data: { nodes: Node[]; edges: Edge[]; metadata: Metadata }) => void)[] = [];

  constructor() {
    effect(() => {
      const nodes = this.nodes();
      const edges = this.edges();
      const metadata = this.metadata();

      for (const callback of this.callbacks) {
        callback({ nodes, edges, metadata });
      }
    });
  }

  // Public API methods implementing ModelAdapter interface
  getNodes(): Node[] {
    return this.nodes();
  }

  getEdges(): Edge[] {
    return this.edges();
  }

  setNodes(next: Node[] | ((prev: Node[]) => Node[])): void {
    this.nodes.update((prev) => (typeof next === 'function' ? next(prev) : next));
  }

  setEdges(next: Edge[] | ((prev: Edge[]) => Edge[])): void {
    this.edges.update((prev) => (typeof next === 'function' ? next(prev) : next));
  }

  getMetadata(): Metadata {
    return this.metadata();
  }

  setMetadata(next: Metadata | ((prev: Metadata) => Metadata)): void {
    this.metadata.update((prev) => (typeof next === 'function' ? next(prev) : next));
  }

  onChange(callback: (data: { nodes: Node[]; edges: Edge[]; metadata: Metadata }) => void): void {
    this.callbacks.push(callback);
  }

  undo(): void {
    // lint:fix
  }

  redo(): void {
    // lint:fix
  }
}
