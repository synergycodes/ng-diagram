import type { ActionStateManager } from '../../../action-state-manager/action-state-manager';
import type { InternalLinkingActionState, LinkingActionState } from '../../../types/action-state.interface';

let gestureIdCounter = 0;

/**
 * Creates the state of a freshly started linking gesture — stamping lives here
 * so no creation site can forget it.
 *
 * @internal
 */
export const createLinkingState = (base: LinkingActionState): InternalLinkingActionState => ({
  ...base,
  _gestureId: ++gestureIdCounter,
});

/**
 * Clears linking only when the live state still belongs to `gestureId`
 * (unstamped === unstamped counts as a match; no live state → no clear, which
 * also avoids a spurious actionStateChanged emit).
 *
 * @internal
 */
export const clearLinkingForGesture = (manager: ActionStateManager, gestureId: number | undefined): void => {
  const current = manager.linking as InternalLinkingActionState | undefined;
  if (current && current._gestureId === gestureId) {
    manager.clearLinking();
  }
};
