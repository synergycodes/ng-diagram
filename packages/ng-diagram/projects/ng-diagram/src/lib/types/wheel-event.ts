/**
 * Defines custom event type used throughout the ngDiagram library for handling user input.
 *
 * The main type, `WheelInputEvent`, extends the native `WheelEvent` with additional flag
 * that indicate zooming diagram interaction have already been handled.
 * These flag is used by input event directives and handlers
 * to coordinate and prevent duplicate processing of the same pointer event.
 *
 * This type is used as the event parameter in input event handlers and services
 * across the public API and internal logic.
 *
 * Example usage:
 * ```ts
 * onWheel(event: WheelInputEvent) {
 *   if (!event.zoomingHandled) {
 *     // handle zooming logic
 *     event.zoomingHandled = true;
 *   }
 * }
 * ```
 */
export interface WheelInputEvent extends WheelEvent {
  zoomingHandled?: boolean;
}
