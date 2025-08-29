import { EffectRef, Injectable, effect, signal } from '@angular/core';
import type {
  Edge,
  Metadata,
  MiddlewareChain,
  MiddlewaresConfigFromMiddlewares,
  ModelAdapter,
  Node,
} from '@angularflow/core';

@Injectable()
export class SignalModelAdapter<TMiddlewares extends MiddlewareChain = []>
  implements ModelAdapter<Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>>>
{
  private effectRef: EffectRef | null = null;
  // Internal state signals
  private nodes = signal<Node[]>([]);
  private edges = signal<Edge[]>([]);
  private metadata = signal<Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>>>({
    viewport: { x: 0, y: 0, scale: 1 },
    // TypeScript requires a value for middlewaresConfig that matches MiddlewaresConfigFromMiddlewares<TMiddlewares>
    // We use a type assertion to satisfy the type system, as we don't know the actual config shape at this point.
    middlewaresConfig: {} as MiddlewaresConfigFromMiddlewares<TMiddlewares>,
  });
  private callbacks: ((data: {
    nodes: Node[];
    edges: Edge[];
    metadata: Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>>;
  }) => void)[] = [];

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
      middlewaresConfig: {} as MiddlewaresConfigFromMiddlewares<TMiddlewares>,
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

  getMetadata(): Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>> {
    return this.metadata();
  }

  setMetadata(
    next:
      | Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>>
      | ((
          prev: Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>>
        ) => Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>>)
  ): void {
    this.metadata.update((prev) => (typeof next === 'function' ? next(prev) : next));
  }

  onChange(
    callback: (data: {
      nodes: Node[];
      edges: Edge[];
      metadata: Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>>;
    }) => void
  ): void {
    this.callbacks.push(callback);
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
