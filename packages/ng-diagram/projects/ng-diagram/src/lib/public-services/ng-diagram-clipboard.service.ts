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
   * @remarks Since 1.4.0 the copy cascades: all descendants of the copied nodes travel with them
   * (including hidden children of a collapsed group), together with the edges connecting copied
   * nodes. Effectively hidden *selected* elements are skipped — consistent with `deleteSelection`.
   *
   * A selected edge is copied even when its endpoint nodes are not — {@link paste} then recreates
   * it with the uncopied endpoints dangling instead of attached to the original nodes; see
   * `paste` for details.
   *
   * @returns A promise that resolves once the selection has been copied.
   */
  copy(): Promise<void> {
    return this.flowCore.commandHandler.emit('copy');
  }

  /**
   * Cuts the current selection to the clipboard.
   *
   * @remarks Same cascade semantics as {@link copy} — a cut collapsed group takes its hidden
   * children through the clipboard and pasting restores them.
   *
   * @returns A promise that resolves once the change has been applied to the model. Inside a transaction, the promise resolves right away and the change is applied when the transaction commits.
   */
  cut(): Promise<void> {
    return this.flowCore.commandHandler.emit('cut');
  }

  /**
   * Pastes the clipboard content at the specified position.
   *
   * @remarks Edge endpoints whose node was copied together with the edge are remapped to the
   * newly pasted nodes. An endpoint whose node was NOT copied becomes dangling — empty
   * `source`/`target` with `sourcePosition`/`targetPosition` at the edge's last attachment
   * point — instead of being attached to the original node, so pasting a lone edge never
   * duplicates the connection between the original nodes; reconnect or reposition the pasted
   * edge as needed. Already-dangling endpoints stay dangling. Free endpoints anchor the pasted
   * content at the target `position` exactly like node positions do — pasting only edges centers
   * them at the cursor. An edge whose freed endpoint has no known position (it was never routed)
   * is skipped.
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
