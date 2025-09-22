import { EffectRef, Injectable, effect, signal } from '@angular/core';
import type { Edge, Metadata, ModelAdapter, ModelChanges, Node } from '../../core/src';

/**
 * An implementation of ModelAdapter using Angular signals to manage the state of nodes, edges, and metadata.
 *
 * @internal
 */
@Injectable()
export class SignalModelAdapter implements ModelAdapter {
  private effectRef: EffectRef | null = null;
  // Internal state signals
  private nodes = signal<Node[]>([]);
  private edges = signal<Edge[]>([]);
  private metadata = signal<Metadata>({
    viewport: { x: 0, y: 0, scale: 1 },
  });
  private callbacks: ((data: { nodes: Node[]; edges: Edge[]; metadata: Metadata }) => void)[] = [];

  constructor() {
    this.effectRef = effect(() => {
      const nodes = this.nodes();
      const edges = this.edges();
      const metadata = this.metadata();

      for (const callback of this.callbacks) {
        callback({ nodes, edges, metadata });
      }
    });
  }

  destroy(): void {
    this.effectRef?.destroy();
    this.callbacks = [];
    this.nodes.set([]);
    this.edges.set([]);
    this.metadata.set({
      viewport: { x: 0, y: 0, scale: 1 },
    });
  }

  // Public API methods implementing ModelAdapter interface
  getNodes(): Node[] {
    return this.nodes();
  }

  getEdges(): Edge[] {
    return this.edges();
  }

  updateNodes(next: Node[] | ((prev: Node[]) => Node[])): void {
    this.nodes.update((prev) => (typeof next === 'function' ? next(prev) : next));
  }

  updateEdges(next: Edge[] | ((prev: Edge[]) => Edge[])): void {
    this.edges.update((prev) => (typeof next === 'function' ? next(prev) : next));
  }

  getMetadata(): Metadata {
    return this.metadata();
  }

  setMetadata(next: Metadata | ((prev: Metadata) => Metadata)): void {
    this.metadata.update((prev) => (typeof next === 'function' ? next(prev) : next));
  }

  onChange(callback: (data: ModelChanges) => void): void {
    this.callbacks.push(callback);
  }

  unregisterOnChange(callback: (data: ModelChanges) => void): void {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
  }

  undo(): void {
    // lint:fix
  }

  redo(): void {
    // lint:fix
  }

  toJSON(): string {
    const metadata = this.metadata();
    return JSON.stringify({
      /* eslint-disable @typescript-eslint/no-unused-vars */
      nodes: this.nodes().map(({ selected, ...rest }) => rest),
      edges: this.edges().map(({ points, sourcePosition, targetPosition, ...rest }) => rest),
      metadata,
      /* eslint-enable @typescript-eslint/no-unused-vars */
    });
  }
}
