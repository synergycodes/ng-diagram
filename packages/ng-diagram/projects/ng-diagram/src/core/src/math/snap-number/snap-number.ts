/**
 * Snaps a value to the nearest multiple of `step`, optionally shifted by `offset`.
 *
 * Snapped values follow the sequence `offset + n * step` (n integer), so with
 * `offset = 60` and `step = 50` the value snaps to 60, 110, 160, ... instead of
 * 0, 50, 100, ... This is useful when a node has a fixed base size (e.g. a header
 * or a minimum height) that the snap grid should start from.
 *
 * A `step` of 0 disables snapping and returns the value unchanged.
 */
export const snapNumber = (value: number, step: number, offset = 0): number =>
  step ? offset + step * Math.round((value - offset) / step) : value;
