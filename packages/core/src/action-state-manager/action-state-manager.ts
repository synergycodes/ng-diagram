import type {
  ActionState,
  CopyPasteActionState,
  DraggingActionState,
  HighlightGroupActionState,
  LinkingActionState,
  ResizeActionState,
  RotationActionState,
} from '../types/action-state.interface';

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

  get copyPaste(): CopyPasteActionState | undefined {
    return this.state.copyPaste;
  }

  set copyPaste(value: CopyPasteActionState | undefined) {
    this.state.copyPaste = value;
  }

  get highlightGroup(): HighlightGroupActionState | undefined {
    return this.state.highlightGroup;
  }

  set highlightGroup(value: HighlightGroupActionState | undefined) {
    this.state.highlightGroup = value;
  }

  get rotation(): RotationActionState | undefined {
    return this.state.rotation;
  }

  set rotation(value: RotationActionState | undefined) {
    this.state.rotation = value;
  }

  get dragging(): DraggingActionState | undefined {
    return this.state.dragging;
  }

  set dragging(value: DraggingActionState | undefined) {
    this.state.dragging = value;
  }

  clearResize() {
    this.state.resize = undefined;
  }

  clearLinking() {
    this.state.linking = undefined;
  }

  clearCopyPaste() {
    this.state.copyPaste = undefined;
  }

  clearHighlightGroup() {
    this.state.highlightGroup = undefined;
  }

  clearRotation() {
    this.state.rotation = undefined;
  }

  clearDragging() {
    this.state.dragging = undefined;
  }

  isResizing(): boolean {
    return !!this.state.resize;
  }

  isLinking(): boolean {
    return !!this.state.linking;
  }

  isRotating(): boolean {
    return !!this.state.rotation;
  }

  isDragging(): boolean {
    return !!this.state.dragging;
  }
}
