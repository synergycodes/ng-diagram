import { Injectable } from '@angular/core';
import { Point } from '../../core/src';
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
   */
  copy() {
    this.flowCore.commandHandler.emit('copy');
  }

  /**
   * Cuts the current selection to the clipboard.
   */
  cut() {
    this.flowCore.commandHandler.emit('cut');
  }

  /**
   * Pastes the clipboard content at the specified position.
   * @param position The position where to paste the content.
   */
  paste(position: Point) {
    this.flowCore.commandHandler.emit('paste', { position });
  }
}
