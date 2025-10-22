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
 * Checks if a position has valid (non-null) coordinates.
 * Used during initialization to determine if an entity has been positioned.
 * Note: Position values of 0 are valid (e.g., top-left corner).
 *
 * @param position - Position to validate
 * @returns true if both x and y are not null/undefined
 */
export const isValidPosition = (position: Point | undefined | null): boolean => {
  return position?.x != null && position?.y != null;
};
