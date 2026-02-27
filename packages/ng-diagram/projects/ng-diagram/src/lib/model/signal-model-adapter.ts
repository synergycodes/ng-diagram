import { EffectRef, Injectable, effect, signal, untracked } from '@angular/core';
import type { Edge, Metadata, ModelAdapter, ModelChanges, Node } from '../../core/src';
import { stripEdgeRuntimeProperties, stripNodeRuntimeProperties } from './strip-runtime-properties';

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
      // Angular 18 backward compatibility
      untracked(() => {
        for (const callback of this.callbacks) {
          callback({ nodes, edges, metadata });
        }
      });
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

  updateMetadata(next: Metadata | ((prev: Metadata) => Metadata)): void {
    this.metadata.update((prev) => (typeof next === 'function' ? next(prev) : next));
  }

  onChange(callback: (data: ModelChanges) => void): void {
    this.callbacks.push(callback);
  }

  unregisterOnChange(callback: (data: ModelChanges) => void): void {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
  }

  undo(): void {
    console.warn(
      'Undo is not implemented in the current model. Please implement a custom ModelAdapter to support undo functionality.'
    );
  }

  redo(): void {
    console.warn(
      'Redo is not implemented in the current model. Please implement a custom ModelAdapter to support redo functionality.'
    );
  }

  toJSON(): string {
    const metadata = this.metadata();
    return JSON.stringify({
      nodes: this.nodes().map(stripNodeRuntimeProperties),
      edges: this.edges().map(stripEdgeRuntimeProperties),
      metadata,
    });
  }
}
