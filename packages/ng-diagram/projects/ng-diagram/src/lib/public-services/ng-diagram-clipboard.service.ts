import { Injectable } from '@angular/core';
import { Point } from '../../core/src';
import { emitWithMeasurementOption } from './emit-with-measurement-option';
import { NgDiagramBaseService } from './ng-diagram-base.service';

/**
 * The `NgDiagramClipboardService` provides clipboard operations for diagram.
 *
 * ## Example usage
 * ```typescript
 * private clipboardService = inject(NgDiagramClipboardService);
 *
 * // Copy selected elements
 * this.clipboardService.copy();
 * ```
 *
 * @public
 * @since 0.8.0
 * @category Services
 */
@Injectable()
export class NgDiagramClipboardService extends NgDiagramBaseService {
  /**
   * Copies the current selection to the clipboard.
   *
   * @remarks Since 1.4.0, copying a node also copies all of its descendants (including the hidden
   * children of a collapsed group) and the edges between the copied nodes. Selected elements that
   * are effectively hidden are skipped, the same as in `deleteSelection`.
   *
   * A selected edge is copied even when its endpoint nodes are not. {@link paste} then recreates
   * it with a free end in place of each node that was not copied, instead of connecting it to
   * the original node. See `paste` for details.
   *
   * @returns A promise that resolves once the selection has been copied.
   */
  copy(): Promise<void> {
    return this.flowCore.commandHandler.emit('copy');
  }

  /**
   * Cuts the current selection to the clipboard.
   *
   * @remarks Works like {@link copy}: cutting a collapsed group also cuts its hidden children,
   * and pasting restores them.
   *
   * @returns A promise that resolves once the change has been applied to the model. Inside a transaction, the promise resolves right away and the change is applied when the transaction commits.
   */
  cut(): Promise<void> {
    return this.flowCore.commandHandler.emit('cut');
  }

  /**
   * Pastes the clipboard content at the specified position.
   *
   * @remarks An edge endpoint whose node was copied together with the edge connects to the newly
   * pasted node. An endpoint whose node was NOT copied is pasted as a free end: `source`/`target`
   * is set to `''`, and `sourcePosition`/`targetPosition` holds the last position where the edge
   * was attached, moved together with the pasted content. The end is not connected to the
   * original node, so pasting a single edge never duplicates the connection between the original
   * nodes. Reconnect or move the pasted edge as needed. Endpoints that were already free stay free.
   * Free endpoints count like node positions when the pasted content is centered at `position`,
   * so pasting only edges centers them at the cursor. An edge whose free end has no known position
   * (the edge was never routed) is skipped.
   *
   * @param position The position where to paste the content.
   * @param options Optional settings. Set `waitForMeasurements: true` to resolve only after the
   * pasted elements have been measured — useful before calling `zoomToFit()` or
   * `centerOnNode()`. Available since 1.3.0.
   * @returns A promise that resolves once the change has been applied to the model. Inside a transaction, the promise resolves right away and the change is applied when the transaction commits.
   */
  paste(position: Point, options?: { waitForMeasurements?: boolean }): Promise<void> {
    return emitWithMeasurementOption(this.flowCore, 'paste', { position }, options);
  }
}
