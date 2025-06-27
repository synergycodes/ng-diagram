import { Injectable, effect, signal } from '@angular/core';
import type {
  CombinedMiddlewaresMetadata,
  Edge,
  Metadata,
  MiddlewareArray,
  MiddlewaresMetadataFromMiddlewares,
  ModelAdapter,
  Node,
} from '@angularflow/core';

@Injectable()
export class SignalModelAdapter<
  TCustomMiddlewares extends MiddlewareArray = [],
  TMetadata extends Metadata<CombinedMiddlewaresMetadata<TCustomMiddlewares>> = Metadata<
    CombinedMiddlewaresMetadata<TCustomMiddlewares>
  >,
> implements ModelAdapter<TMetadata>
{
  // Internal state signals
  private nodes = signal<Node[]>([]);
  private edges = signal<Edge[]>([]);
  private metadata = signal<TMetadata>({
    viewport: { x: 0, y: 0, scale: 1 },
    middlewaresMetadata: {} as MiddlewaresMetadataFromMiddlewares<TCustomMiddlewares>,
  } as TMetadata);
  private callbacks: ((data: { nodes: Node[]; edges: Edge[]; metadata: TMetadata }) => void)[] = [];

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

  getMetadata(): TMetadata {
    return this.metadata();
  }

  setMetadata(next: TMetadata | ((prev: TMetadata) => TMetadata)): void {
    this.metadata.update((prev) => (typeof next === 'function' ? next(prev) : next));
  }

  updateMiddlewareMetadata<TName extends keyof TMetadata['middlewaresMetadata']>(
    middlewareName: TName,
    state: TMetadata['middlewaresMetadata'][TName]
  ): void {
    this.metadata.update((prev) => ({
      ...prev,
      middlewaresMetadata: {
        ...prev.middlewaresMetadata,
        [middlewareName]: state,
      },
    }));
  }

  onChange(callback: (data: { nodes: Node[]; edges: Edge[]; metadata: TMetadata }) => void): void {
    this.callbacks.push(callback);
  }

  undo(): void {
    // lint:fix
  }

  redo(): void {
    // lint:fix
  }
}
