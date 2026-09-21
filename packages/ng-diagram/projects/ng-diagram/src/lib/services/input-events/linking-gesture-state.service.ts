import { Injectable, signal } from '@angular/core';

/**
 * Shared state of the edge draw gesture, whichever entry point started it:
 * a port drag (`LinkingInputDirective`) or `startLinking` /
 * `startLinkingFromPosition` (`ManualLinkingService`).
 */
@Injectable()
export class LinkingGestureStateService {
  /**
   * True from gesture start to finish/cancel. Drives the diagram host's
   * `linking` class, which holds the grabbing cursor for the whole draw.
   */
  readonly active = signal(false);
}
