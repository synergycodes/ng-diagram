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
 *
 * @public
 * @since 0.8.0
 * @category Types/Events
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
 * Defines a custom event type for touch input events used in the ngDiagram library.
 * This type extends the native `TouchEvent` with an additional flag
 * to indicate whether zooming has already been handled for the event.
 *
 * @public
 * @since TODO: add version
 * @category Types/Events
 */
export interface TouchInputEvent extends TouchEvent {
  zoomingHandled?: boolean;
  boxSelectionHandled?: boolean;
}
