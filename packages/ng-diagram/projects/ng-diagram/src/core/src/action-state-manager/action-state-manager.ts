import type { EventManager } from '../event-manager/event-manager';
import type {
  ActionState,
  CopyPasteActionState,
  DraggingActionState,
  HighlightGroupActionState,
  LinkingActionState,
  PanningActionState,
  ResizeActionState,
  RotationActionState,
  SelectionActionState,
} from '../types/action-state.interface';

/**
 * **Internal manager** for temporary state during ongoing user actions.
 * Tracks the state of interactive operations like resizing, linking, rotating, and dragging
 * until the action completes.
 *
 * @remarks
 * **For application code, use {@link NgDiagramService.actionState} signal instead.**
 * This class is exposed primarily for middleware development where you can access it
 * via `context.actionStateManager`.
 *
 * @example
 * ```typescript
 * const middleware: Middleware = {
 *   name: 'resize-validator',
 *   execute: (context, next, cancel) => {
 *     const resizeState = context.actionStateManager.resize;
 *     if (resizeState) {
 *       console.log('Currently resizing node:', resizeState.nodeId);
 *     }
 *     next();
 *   }
 * };
 * ```
 *
 * @public
 * @since 0.8.0
 * @category Internals
 */
export class ActionStateManager {
  private state: ActionState;

  constructor(private readonly eventManager: EventManager) {
    this.state = new Proxy<ActionState>(
      {},
      {
        set: (target, property, value) => {
          target[property as keyof ActionState] = value;
          this.emitStateChanged();
          return true;
        },
      }
    );
  }

  /**
   * Gets the current action state (readonly).
   *
   * @returns The complete action state object
   */
  getState(): Readonly<ActionState> {
    return this.state;
  }

  /**
   * Emits an 'actionStateChanged' event with the current state.
   * @internal
   */
  private emitStateChanged(): void {
    this.eventManager.emit('actionStateChanged', { actionState: { ...this.state } });
  }

  /**
   * Gets the current resize action state.
   *
   * @returns The resize state if a resize is in progress, undefined otherwise
   */
  get resize(): ResizeActionState | undefined {
    return this.state.resize;
  }

  /**
   * Sets the resize action state.
   *
   * @param value - The resize state to set, or undefined to clear
   */
  set resize(value: ResizeActionState | undefined) {
    this.state.resize = value;
  }

  /**
   * Gets the current linking action state.
   *
   * @returns The linking state if a link is being created, undefined otherwise
   */
  get linking(): LinkingActionState | undefined {
    return this.state.linking;
  }

  /**
   * Sets the linking action state.
   *
   * @param value - The linking state to set, or undefined to clear
   */
  set linking(value: LinkingActionState | undefined) {
    this.state.linking = value;
  }

  /**
   * Gets the current copy/paste action state.
   *
   * @returns The copy/paste state if a copy/paste operation is in progress, undefined otherwise
   */
  get copyPaste(): CopyPasteActionState | undefined {
    return this.state.copyPaste;
  }

  /**
   * Sets the copy/paste action state.
   *
   * @param value - The copy/paste state to set, or undefined to clear
   */
  set copyPaste(value: CopyPasteActionState | undefined) {
    this.state.copyPaste = value;
  }

  /**
   * Gets the current highlight group action state.
   *
   * @returns The highlight group state if a group is being highlighted, undefined otherwise
   */
  get highlightGroup(): HighlightGroupActionState | undefined {
    return this.state.highlightGroup;
  }

  /**
   * Sets the highlight group action state.
   *
   * @param value - The highlight group state to set, or undefined to clear
   */
  set highlightGroup(value: HighlightGroupActionState | undefined) {
    this.state.highlightGroup = value;
  }

  /**
   * Gets the current rotation action state.
   *
   * @returns The rotation state if a rotation is in progress, undefined otherwise
   */
  get rotation(): RotationActionState | undefined {
    return this.state.rotation;
  }

  /**
   * Sets the rotation action state.
   *
   * @param value - The rotation state to set, or undefined to clear
   */
  set rotation(value: RotationActionState | undefined) {
    this.state.rotation = value;
  }

  /**
   * Gets the current dragging action state.
   *
   * @returns The dragging state if nodes are being dragged, undefined otherwise
   */
  get dragging(): DraggingActionState | undefined {
    return this.state.dragging;
  }

  /**
   * Sets the dragging action state.
   *
   * @param value - The dragging state to set, or undefined to clear
   */
  set dragging(value: DraggingActionState | undefined) {
    this.state.dragging = value;
  }

  /**
   * Gets the current panning action state.
   *
   * @returns The panning state if viewport is being panned, undefined otherwise
   */
  get panning(): PanningActionState | undefined {
    return this.state.panning;
  }

  /**
   * Sets the panning action state.
   *
   * @param value - The panning state to set, or undefined to clear
   */
  set panning(value: PanningActionState | undefined) {
    this.state.panning = value;
  }

  /**
   * Clears the resize action state.
   */
  clearResize() {
    this.state.resize = undefined;
  }

  /**
   * Clears the linking action state.
   */
  clearLinking() {
    this.state.linking = undefined;
  }

  /**
   * Clears the copy/paste action state.
   */
  clearCopyPaste() {
    this.state.copyPaste = undefined;
  }

  /**
   * Clears the highlight group action state.
   */
  clearHighlightGroup() {
    this.state.highlightGroup = undefined;
  }

  /**
   * Clears the rotation action state.
   */
  clearRotation() {
    this.state.rotation = undefined;
  }

  /**
   * Clears the dragging action state.
   */
  clearDragging() {
    this.state.dragging = undefined;
  }

  /**
   * Checks if a resize operation is currently in progress.
   */
  isResizing(): boolean {
    return !!this.state.resize;
  }

  /**
   * Checks if a linking operation is currently in progress.
   */
  isLinking(): boolean {
    return !!this.state.linking;
  }

  /**
   * Checks if a rotation operation is currently in progress.
   */
  isRotating(): boolean {
    return !!this.state.rotation;
  }

  /**
   * Checks if a dragging operation is currently in progress.
   */
  isDragging(): boolean {
    return !!this.state.dragging;
  }

  /**
   * Clears the panning action state.
   */
  clearPanning() {
    this.state.panning = undefined;
  }

  /**
   * Checks if a panning operation is currently in progress.
   */
  isPanning(): boolean {
    return !!this.state.panning?.active;
  }

  /**
   * Gets the current selection action state.
   *
   * @returns The selection state if set, undefined otherwise
   */
  get selection(): SelectionActionState | undefined {
    return this.state.selection;
  }

  /**
   * Sets the selection action state.
   *
   * @param value - The selection state to set, or undefined to clear
   */
  set selection(value: SelectionActionState | undefined) {
    this.state.selection = value;
  }

  /**
   * Clears the selection action state.
   */
  clearSelection() {
    this.state.selection = undefined;
  }
}
