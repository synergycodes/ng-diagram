import { computed, inject, Injectable, Signal } from '@angular/core';
import { NgDiagramService } from '../../public-services/ng-diagram.service';

/**
 * Tracks whether a continuous node interaction (drag, resize, rotation)
 * is currently in progress.
 *
 * Used by the minimap to optionally defer node updates during interactions,
 * avoiding expensive per-frame recomputations.
 *
 * @internal
 */
@Injectable()
export class MinimapInteractionTracker {
  private readonly diagramService = inject(NgDiagramService);

  readonly isInteracting: Signal<boolean> = computed(() => {
    const actionState = this.diagramService.actionState();
    return !!actionState.dragging?.movementStarted || !!actionState.resize || !!actionState.rotation;
  });
}
