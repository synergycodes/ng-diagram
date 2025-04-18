import { Injectable, effect, signal } from '@angular/core';
import type { Edge, ModelAdapter, Node } from '@angularflow/core';

@Injectable()
export class SignalModelAdapter implements ModelAdapter {
  // Internal state signals
  private nodes = signal<Node[]>([]);
  private edges = signal<Edge[]>([]);
  private metadata = signal<Record<string, unknown>>({});
  private callbacks: (() => void)[] = [];

  constructor() {
    effect(() => {
      this.nodes();
      this.edges();
      this.metadata();

      for (const callback of this.callbacks) {
        callback();
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

  getMetadata(): Record<string, unknown> {
    return this.metadata();
  }

  setMetadata(next: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)): void {
    this.metadata.update((prev) => (typeof next === 'function' ? next(prev) : next));
  }

  onChange(callback: () => void): void {
    this.callbacks.push(callback);
  }

  undo(): void {}

  redo(): void {}
}
