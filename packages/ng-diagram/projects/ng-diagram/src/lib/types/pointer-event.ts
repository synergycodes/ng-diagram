/**
 * Defines custom event types used throughout the ngDiagram library for handling user input.
 *
 * The main type, `PointerInputEvent`, extends the native `PointerEvent` with additional flags
 * that indicate whether specific diagram interactions (such as selection, zooming, linking, rotation)
 * have already been handled. These flags are used by input event directives and handlers
 * to coordinate and prevent duplicate processing of the same pointer event.
 *
 * This type is used as the event parameter in input event handlers and services
 * across the public API and internal logic.
 *
 * Example usage:
 * ```ts
 * onPointerDown(event: PointerInputEvent) {
 *   if (!event.linkingHandled) {
 *     // handle linking logic
 *     event.linkingHandled = true;
 *   }
 * }
 * ```
 */
export interface PointerInputEvent extends PointerEvent {
  moveSelectionHandled?: boolean;
  zoomingHandled?: boolean;
  linkingHandled?: boolean;
  rotateHandled?: boolean;
  selectHandled?: boolean;
  boxSelectionHandled?: boolean;
}

/**
 * Enum representing the different types of pointer/touch events in ng-diagram.
 *
 * @internal
 */
export enum DiagramEventName {
  Rotate = 'rotate',
  Resize = 'resize',
  Move = 'move',
  BoxSelection = 'box-selection',
  Linking = 'linking',
  Panning = 'panning',
  Zooming = 'zooming',
}
