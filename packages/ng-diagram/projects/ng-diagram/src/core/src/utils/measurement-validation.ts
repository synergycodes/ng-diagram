import { Point, Size } from '../types';

/**
 * Checks if a size has valid (non-zero) dimensions.
 * Used during initialization to determine if an entity has been measured.
 *
 * @param size - Size to validate
 * @returns true if both width and height are greater than 0
 */
export const isValidSize = (size: Size | undefined | null): boolean => {
  return (size?.width ?? 0) > 0 && (size?.height ?? 0) > 0;
};

/**
 * Checks if a size is the `display: none` signature: both dimensions exactly 0.
 * ResizeObserver reports 0×0 for hidden elements — such reports must never
 * overwrite existing geometry. Deliberately narrower than `!isValidSize`:
 * a degenerate-but-visible measurement (e.g. 200×0) is not zero-size.
 *
 * @param size - Size to check
 * @returns true if both width and height are exactly 0
 */
export const isZeroSize = (size: Size | undefined | null): boolean => {
  return size?.width === 0 && size?.height === 0;
};

/**
 * Checks if a position has valid (non-null, non-NaN) coordinates.
 * Used during initialization to determine if an entity has been positioned.
 * Note: Position values of 0 are valid (e.g., top-left corner).
 *
 * @param position - Position to validate
 * @returns true if both x and y are not null/undefined/NaN
 */
export const isValidPosition = (position: Point | undefined | null): boolean => {
  return position?.x != null && position?.y != null && !isNaN(position.x) && !isNaN(position.y);
};
