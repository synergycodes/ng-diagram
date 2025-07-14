import { PortSide } from '../../../types';

/**
 * Returns the new position of a handle after a given rotation.
 *
 * @param initialPosition - The initial position of the handle.
 * @param rotation - The rotation angle in degrees (should be a multiple of 90).
 * @returns The new position of the handle after the rotation.
 */
export const getHandlePosition = (initialPosition: PortSide, rotation: number): PortSide => {
  // Rotation map for handles (clockwise)
  const positionMap: Record<PortSide, PortSide[]> = {
    top: ['top', 'right', 'bottom', 'left'],
    right: ['right', 'bottom', 'left', 'top'],
    bottom: ['bottom', 'left', 'top', 'right'],
    left: ['left', 'top', 'right', 'bottom'],
  };

  // Calculate the rotation index (0° -> 0, 90° -> 1, 180° -> 2, 270° -> 3)
  const rotationIndex = Math.floor(rotation / 90) % 4;

  return positionMap[initialPosition][rotationIndex];
};
