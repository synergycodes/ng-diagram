export interface PointerInputEvent extends PointerEvent {
  moveSelectionHandled?: boolean;
  zoomingHandled?: boolean;
  linkingHandled?: boolean;
  rotateHandled?: boolean;
  selectHandled?: boolean;
}
