import { Injectable } from '@angular/core';
import { MiddlewareChain, Point } from '@angularflow/core';
import { NgDiagramBaseService } from './ng-diagram-base.service';

@Injectable()
export class NgDiagramClipboardService<
  TMiddlewares extends MiddlewareChain = [],
> extends NgDiagramBaseService<TMiddlewares> {
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
