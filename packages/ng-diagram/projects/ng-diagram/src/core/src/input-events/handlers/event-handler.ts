import { FlowCore } from '../../flow-core';
import { BaseInputEvent } from '../input-events.interface';

export abstract class EventHandler<TEvent extends BaseInputEvent> {
  /**
   * State whose end/cancel claimed the teardown. Never reset — a fresh state
   * object per gesture means a stale claim cannot match a live one.
   */
  private claimedTeardownState: unknown;

  constructor(protected readonly flow: FlowCore) {}

  /** Handles one input event. Invoked un-awaited — implementations must tolerate interleaving at every await. */
  abstract handle(event: TEvent): void | Promise<void>;

  /**
   * Claims the teardown of the gesture owning `state`, so a racing cancel()
   * (or a second one) no-ops. Requires one state object per gesture lifetime —
   * linking stamps its replaced state instead, drag uses `DragGesture.ended`.
   */
  protected claimTeardown(state: unknown): void {
    this.claimedTeardownState = state;
  }

  /** Whether `state`'s teardown was already claimed by an in-flight end or cancel. */
  protected isTeardownClaimed(state: unknown): boolean {
    return state !== undefined && state === this.claimedTeardownState;
  }

  /**
   * Aborts the tracked gesture without the side effects of a normal `end`
   * (no edge creation, no group drop). Default: no-op.
   *
   * @returns Whether anything was torn down — `false` when there is no gesture
   * or its teardown is already claimed by an in-flight end or cancel.
   */
  cancel(): boolean | Promise<boolean> {
    return false;
  }
}
