import type { ActionState } from '../types';
import type { DiagramEventMap } from './event-types';

/**
 * Internal event map that extends the public DiagramEventMap with internal-only events.
 * These events are used internally by the library but are not part of the public API.
 *
 * @internal
 */
export interface InternalDiagramEventMap extends DiagramEventMap {
  /**
   * Event emitted when the action state changes.
   *
   * This event fires when an action like resizing, rotating, or linking
   * starts or ends, allowing subscribers to react to state changes.
   *
   * @internal - For internal use only. Use the `actionState` signal on NgDiagramService instead.
   */
  actionStateChanged: ActionStateChangedEvent;

  /**
   * Event emitted when panning starts (mouse down on canvas for pan).
   * Used internally by BufferFillManager to cancel pending buffer fills.
   *
   * @internal
   */
  panStarted: PanStartedEvent;

  /**
   * Event emitted when panning ends (mouse up after pan).
   * Used internally by BufferFillManager to schedule buffer fill.
   *
   * @internal
   */
  panEnded: PanEndedEvent;
}

/**
 * Event payload emitted when the action state changes.
 *
 * This event fires when an action like resizing, rotating, or linking
 * starts or ends, allowing subscribers to react to state changes.
 *
 * @internal
 */
export interface ActionStateChangedEvent {
  /** The current action state */
  actionState: Readonly<ActionState>;
}

/**
 * Event payload emitted when panning starts.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PanStartedEvent {
  // Empty payload - just signals pan started
}

/**
 * Event payload emitted when panning ends.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PanEndedEvent {
  // Empty payload - just signals pan ended
}
