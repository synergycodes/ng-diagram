import { inject, Injectable } from '@angular/core';
import { FlowCore, MiddlewareChain, Point } from '@angularflow/core';
import { FlowCoreProviderService } from '../services';

@Injectable()
export class NgDiagramClipboardService<TMiddlewares extends MiddlewareChain = []> {
  private readonly flowCoreProvider = inject(FlowCoreProviderService<TMiddlewares>);

  private get flowCore(): FlowCore<TMiddlewares> {
    return this.flowCoreProvider.provide();
  }

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
