import type { ActionState, LinkingActionState, ResizeActionState } from '../types/action-state.interface';

/**
 * Manages temporary state during ongoing actions
 * (e.g., resizing or linking) until the action completes.
 */
export class ActionStateManager {
  private state: ActionState = {};

  getState(): Readonly<ActionState> {
    return this.state;
  }

  get resize(): ResizeActionState | undefined {
    return this.state.resize;
  }

  set resize(value: ResizeActionState | undefined) {
    this.state.resize = value;
  }

  get linking(): LinkingActionState | undefined {
    return this.state.linking;
  }

  set linking(value: LinkingActionState | undefined) {
    this.state.linking = value;
  }

  clearResize() {
    this.state.resize = undefined;
  }

  clearLinking() {
    this.state.linking = undefined;
  }

  isResizing(): boolean {
    return !!this.state.resize;
  }

  isLinking(): boolean {
    return !!this.state.linking;
  }
}
