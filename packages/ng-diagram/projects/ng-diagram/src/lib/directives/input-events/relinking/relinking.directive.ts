import { Directive, inject, input } from '@angular/core';
import { Edge, EdgeEnd } from '../../../../core/src';
import { RelinkingGestureService } from '../../../services/input-events/relinking-gesture.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PointerInputEvent } from '../../../types';

/**
 * Turns its host element into a grabbable edge-endpoint handle: a pointerdown
 * starts the relink gesture for the given end of the given edge. The gesture
 * itself is driven at document level — the host element unmounts when the
 * edge is hidden during the drag.
 *
 * `ng-diagram-base-edge` renders its own handles with this directive; use it
 * directly in fully custom edge templates that do not compose the base edge.
 *
 * @public
 * @since 1.4.0
 * @category Directives
 */
@Directive({
  selector: '[ngDiagramRelinkHandle]',
  standalone: true,
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class RelinkHandleDirective {
  private readonly relinkingGesture = inject(RelinkingGestureService);
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  edge = input.required<Edge>();
  end = input.required<EdgeEnd>();

  onPointerDown($event: PointerInputEvent) {
    if (!this.inputEventsRouter.eventGuards.withPrimaryButton($event)) {
      return;
    }

    // Mark the event only when the gesture is actually claimed — a refused
    // relink (another gesture owns the pointer, the end is not relinkable) must not
    // turn the pointerdown into a dead click that neither selects nor pans.
    if (this.relinkingGesture.beginRelink($event, this.edge(), this.end())) {
      $event.relinkHandled = true;
    }
  }
}
