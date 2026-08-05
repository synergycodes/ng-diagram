import { FlowCore } from '../../flow-core';
import { BaseInputEvent } from '../input-events.interface';

export abstract class EventHandler<TEvent extends BaseInputEvent> {
  /**
   * The gesture state whose end or cancel claimed the teardown — see
   * {@link claimTeardown}. Never reset: every gesture starts with a fresh
   * state object, so a stale claim can never match a live gesture.
   */
  private claimedTeardownState: unknown;

  constructor(protected readonly flow: FlowCore) {}

  abstract handle(event: TEvent): void | Promise<void>;

  /**
   * Claims the teardown of the gesture owning `state`: the end phase claims it
   * so a racing cancel() no-ops instead of rolling back a completing gesture,
   * and cancel() claims it so a second cancel no-ops.
   *
   * Only usable when the gesture keeps ONE state object for its whole lifetime.
   * Linking replaces its state object mid-gesture, so it stamps the state
   * instead (see `InternalLinkingActionState`); drag folds the claim into its
   * private `DragGesture.ended` flag, which also kills suspended continues.
   */
  protected claimTeardown(state: unknown): void {
    this.claimedTeardownState = state;
  }

  /** Whether `state`'s teardown was already claimed by an in-flight end or cancel. */
  protected isTeardownClaimed(state: unknown): boolean {
    return state !== undefined && state === this.claimedTeardownState;
  }

  /**
   * Aborts the gesture this handler is currently tracking, without the side
   * effects of a normal `end` phase (no edge creation, no group drop, …).
   *
   * Gesture handlers override this to clear their action state, reset internal
   * tracking and let the corresponding "ended" event fire with a cancel reason.
   * The default is a no-op for handlers without an in-progress gesture concept.
   *
   * @returns Whether anything was actually torn down — `false` when there is no
   * gesture, or when its normal end (or another cancel) is already in flight.
   */
  cancel(): boolean | Promise<boolean> {
    return false;
  }
}
