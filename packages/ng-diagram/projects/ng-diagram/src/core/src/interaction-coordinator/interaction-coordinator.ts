import type { FlowCore } from '../flow-core';
import type { InputEventName } from '../input-events';

/**
 * Coordinates gesture cancellation across the two layers: the view layer
 * registers a cleanup for the document-level listeners of the gesture in
 * progress, the core side aborts the gesture handlers — and
 * {@link cancelActiveInteraction} runs both in the right order. Owned by
 * {@link FlowCore}, which exposes every method on its facade.
 */
export class InteractionCoordinator {
  private readonly cleanups = new Set<() => void>();
  private cancelling = false;

  /**
   * Every cancellable gesture: the action-state probe paired with the input
   * event name its handler is registered under. A new cancellable gesture
   * joins {@link hasActiveInteraction} and {@link cancelActiveInteraction} by
   * adding one entry here.
   */
  private readonly cancellableGestures: readonly { event: InputEventName; isActive: () => boolean }[] = [
    { event: 'linking', isActive: () => this.flowCore.actionStateManager.isLinking() },
    { event: 'pointerMoveSelection', isActive: () => this.flowCore.actionStateManager.isDragging() },
    { event: 'resize', isActive: () => this.flowCore.actionStateManager.isResizing() },
    { event: 'rotate', isActive: () => this.flowCore.actionStateManager.isRotating() },
    { event: 'panning', isActive: () => this.flowCore.actionStateManager.isPanning() },
  ];

  constructor(private readonly flowCore: FlowCore) {}

  /** See {@link FlowCore.registerInteractionCleanup}. */
  registerInteractionCleanup(cleanup: () => void): () => void {
    this.cleanups.add(cleanup);
    return () => {
      this.cleanups.delete(cleanup);
    };
  }

  /** See {@link FlowCore.isCancellingInteraction}. */
  isCancellingInteraction(): boolean {
    return this.cancelling;
  }

  /** See {@link FlowCore.hasActiveInteraction}. */
  hasActiveInteraction(): boolean {
    return this.cancellableGestures.some((gesture) => gesture.isActive()) || this.cleanups.size > 0;
  }

  /** See {@link FlowCore.cancelActiveInteraction}. */
  async cancelActiveInteraction(): Promise<boolean> {
    if (this.cancelling) {
      return false;
    }
    if (this.flowCore.transactionManager.isActive()) {
      console.warn(
        '[ngDiagram] cancelActiveInteraction() called while a transaction is active — ignored. The rollback would merge into the transaction and could be discarded with it; await the transaction and cancel afterwards.'
      );
      return false;
    }

    const activeGestures = this.cancellableGestures
      .filter((gesture) => gesture.isActive())
      .map((gesture) => gesture.event);

    this.cancelling = true;
    try {
      // Tear down document-level listeners first so no further pointer events
      // reach the gesture handlers while (or after) they are being cancelled.
      const cleanups = [...this.cleanups];
      this.cleanups.clear();
      for (const cleanup of cleanups) {
        cleanup();
      }

      // One failing cancel must not leave the remaining gestures active — cancel
      // them all, then rethrow the first failure.
      let cancelledAny = false;
      const errors: unknown[] = [];
      for (const gesture of activeGestures) {
        try {
          cancelledAny = (await this.flowCore.inputEventsRouter.cancel(gesture)) || cancelledAny;
        } catch (error) {
          errors.push(error);
        }
      }
      if (errors.length > 0) {
        throw errors[0];
      }

      return cancelledAny || cleanups.length > 0;
    } finally {
      this.cancelling = false;
    }
  }
}
