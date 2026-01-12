import type { Edge, Metadata, ModelAdapter, ModelChanges, Node } from 'ng-diagram';
import { UndoRedoService } from './undo-redo.service';

/**
 * A thin wrapper around ModelAdapter that delegates undo/redo to UndoRedoService.
 *
 * This adapter allows keyboard shortcuts (which call model.undo()/model.redo())
 * to work through the UndoRedoService.
 */
export class UndoRedoModelAdapter implements ModelAdapter {
  constructor(
    private readonly adapter: ModelAdapter,
    private readonly undoRedoService: UndoRedoService
  ) {}

  undo(): void {
    this.undoRedoService.undo();
  }

  redo(): void {
    this.undoRedoService.redo();
  }

  getNodes(): Node[] {
    return this.adapter.getNodes();
  }

  getEdges(): Edge[] {
    return this.adapter.getEdges();
  }

  getMetadata(): Metadata {
    return this.adapter.getMetadata();
  }

  updateMetadata(next: Metadata | ((prev: Metadata) => Metadata)): void {
    if (typeof next === 'function') {
      this.adapter.updateMetadata(next);
    } else {
      this.adapter.updateMetadata(next);
    }
  }

  updateNodes(next: Node[] | ((prev: Node[]) => Node[])): void {
    if (typeof next === 'function') {
      this.adapter.updateNodes(next);
    } else {
      this.adapter.updateNodes(next);
    }
  }

  updateEdges(next: Edge[] | ((prev: Edge[]) => Edge[])): void {
    if (typeof next === 'function') {
      this.adapter.updateEdges(next);
    } else {
      this.adapter.updateEdges(next);
    }
  }

  onChange(callback: (data: ModelChanges) => void): void {
    this.adapter.onChange(callback);
  }

  unregisterOnChange(callback: (data: ModelChanges) => void): void {
    this.adapter.unregisterOnChange(callback);
  }

  toJSON(): string {
    return this.adapter.toJSON();
  }

  destroy(): void {
    this.adapter.destroy();
  }
}
