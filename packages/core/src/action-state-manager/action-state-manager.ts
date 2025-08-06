import type { ActionState, LinkingActionState, ResizeActionState } from '../types/action-state.interface';

export class ActionStateManager {
  private actionState: ActionState = {};

  /**
   * Gets the current resize state
   * @returns Current resize state or undefined
   */
  getResizeState(): ResizeActionState | undefined {
    return this.actionState.resize;
  }

  /**
   * Gets the current linking state
   * @returns Current linking state or undefined
   */
  getLinkingState(): LinkingActionState | undefined {
    return this.actionState.linking;
  }

  /**
   * Checks if resizing is currently active
   * @returns True if resizing is active
   */
  isResizing(): boolean {
    return !!this.actionState.resize;
  }

  /**
   * Checks if linking is currently active
   * @returns True if linking is active
   */
  isLinking(): boolean {
    return !!this.actionState.linking;
  }

  /**
   * Sets the resize state
   * @param resizeState Resize state to set
   */
  setResizeState(resizeState: ResizeActionState): void {
    this.actionState.resize = resizeState;
  }

  /**
   * Sets the linking state
   * @param linkingState Linking state to set
   */
  setLinkingState(linkingState: LinkingActionState): void {
    this.actionState.linking = linkingState;
  }

  /**
   * Clears the resize state
   */
  clearResizeState(): void {
    this.actionState.resize = undefined;
  }

  /**
   * Clears the linking state
   */
  clearLinkingState(): void {
    this.actionState.linking = undefined;
  }
}
