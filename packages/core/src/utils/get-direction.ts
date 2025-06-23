import { LayoutAngleType } from '../types/tree-layout.interface.ts';

export const isAngleVertical = (angle: LayoutAngleType) => angle === 90 || angle == 270;

export const isAngleHorizontal = (angle: LayoutAngleType) => angle === 0 || angle == 180;

export const getSign = (angle: LayoutAngleType) => (angle === 0 || angle == 90 ? 1 : -1);

/**
 * Returns unit vectors for layout based on an angle.
 * - `main`: the primary axis (direction in which children are laid out)
 * - `cross`: the secondary axis (used for spreading children around the center)
 */
export const getDirectionVectors = (angle: LayoutAngleType) => {
  switch (angle) {
    case 90: // Bottom
      return { main: { x: 0, y: 1 }, cross: { x: -1, y: 0 } };
    case 180: // Left
      return { main: { x: -1, y: 0 }, cross: { x: 0, y: 1 } };
    case 270: // Top
      return { main: { x: 0, y: -1 }, cross: { x: 1, y: 0 } };
    case 0: // Right
    default:
      return { main: { x: 1, y: 0 }, cross: { x: 0, y: 1 } };
  }
};
