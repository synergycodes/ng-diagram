import { effect, inject, Injectable, signal } from '@angular/core';
import type { Edge, FlowState, Middleware, MiddlewareContext, ModelActionType, ModelAdapter, Node } from 'ng-diagram';
import { NgDiagramService } from 'ng-diagram';

const DEFAULT_TRACKED_ACTIONS: ModelActionType[] = [
  'addNodes',
  'deleteNodes',
  'clearModel',
  'addEdges',
  'deleteEdges',
  'paletteDropNode',
];

interface UndoRedoSnapshot {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Service that provides undo/redo functionality for ng-diagram.
 *
 * This service uses middleware to capture state for undo/redo operations -
 * capturing once at the START of continuous actions (drag, resize, rotate) and before
 * discrete actions.
 */
@Injectable()
export class UndoRedoService {
  private readonly ngDiagramService = inject(NgDiagramService);

  private undoStack: UndoRedoSnapshot[] = [];
  private redoStack: UndoRedoSnapshot[] = [];

  private readonly maxHistorySize = 50;
  private readonly trackedActionsSet = new Set<string>(DEFAULT_TRACKED_ACTIONS);

  private model: ModelAdapter | null = null;

  private wasDragging = false;
  private wasResizing = false;
  private wasRotating = false;

  readonly canUndo = signal(false);
  readonly canRedo = signal(false);

  constructor() {
    effect(() => {
      const actionState = this.ngDiagramService!.actionState();
      if (!actionState.dragging) this.wasDragging = false;
      if (!actionState.resize) this.wasResizing = false;
      if (!actionState.rotation) this.wasRotating = false;
    });
  }

  /**
   * Initialize the service with model and NgDiagramService.
   * Call this after the diagram is initialized.
   */
  initialize(model: ModelAdapter): void {
    this.model = model;
  }

  /**
   * Get the middleware to register with the diagram.
   * This middleware captures state before discrete and continuous actions.
   */
  getMiddleware(): Middleware {
    return {
      name: 'undo-redo',
      execute: (context: MiddlewareContext, next: () => void) => {
        const asm = context.actionStateManager;

        // Detect continuous action START and capture initial state
        // Note: isDragging is also true during selection, so check it's not just a selection change
        const isSelectionOnly = context.modelActionTypes.includes('changeSelection');
        if (asm.isDragging() && !this.wasDragging && !isSelectionOnly) {
          this.pushToUndoStack(this.extractState(context.initialState));
          this.wasDragging = true;
        }
        if (asm.isResizing() && !this.wasResizing) {
          this.pushToUndoStack(this.extractState(context.initialState));
          this.wasResizing = true;
        }
        if (asm.isRotating() && !this.wasRotating) {
          this.pushToUndoStack(this.extractState(context.initialState));
          this.wasRotating = true;
        }

        // Track finishLinking only if an edge was actually created
        if (context.modelActionTypes.includes('finishLinking')) {
          const edgesAdded = context.initialUpdate.edgesToAdd?.length ?? 0;
          if (edgesAdded > 0) {
            this.pushToUndoStack(this.extractState(context.initialState));
          }
        }

        // Track discrete actions (only if not already tracked as continuous)
        const shouldTrackDiscrete = context.modelActionTypes.some((action) => this.trackedActionsSet.has(action));
        if (shouldTrackDiscrete) {
          this.pushToUndoStack(this.extractState(context.initialState));
        }

        next();
      },
    };
  }

  /**
   * Undo the last change.
   */
  undo(): void {
    this.moveState(this.undoStack, this.redoStack);
  }

  /**
   * Redo the last undone change.
   */
  redo(): void {
    this.moveState(this.redoStack, this.undoStack);
  }

  private extractState(flowState: FlowState): UndoRedoSnapshot {
    return {
      nodes: flowState.nodes,
      edges: flowState.edges,
    };
  }

  private createSnapshot(): UndoRedoSnapshot {
    return structuredClone({
      nodes: this.model!.getNodes(),
      edges: this.model!.getEdges(),
    });
  }

  private applySnapshot(snapshot: UndoRedoSnapshot): void {
    this.model!.updateNodes(snapshot.nodes);
    this.model!.updateEdges(snapshot.edges);
  }

  private pushToUndoStack(snapshot: UndoRedoSnapshot): void {
    this.undoStack.push(structuredClone(snapshot));

    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }

    this.redoStack = [];

    this.updateSignals();
  }

  private updateSignals(): void {
    this.canUndo.set(this.undoStack.length > 0);
    this.canRedo.set(this.redoStack.length > 0);
  }

  private moveState(sourceStack: UndoRedoSnapshot[], targetStack: UndoRedoSnapshot[]): void {
    if (sourceStack.length === 0 || !this.model) return;

    const currentSnapshot = this.createSnapshot();
    targetStack.push(currentSnapshot);

    const snapshot = sourceStack.pop()!;
    this.applySnapshot(snapshot);

    this.updateSignals();
  }
}
