import { Injectable } from '@angular/core';
import { Point } from '@angularflow/core';
import { NgDiagramBaseService } from './ng-diagram-base.service';

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
