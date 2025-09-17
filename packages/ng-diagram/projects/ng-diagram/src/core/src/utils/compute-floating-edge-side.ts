import { NgDiagramMath } from '../math';
import type { Node, Point, PortSide } from '../types';

/**
 * Computes the optimal side for a floating edge end (near cursor)
 * based on the relative position to the starting point.
 *
 * @param startNode - The node where drawing started
 * @param startPort - The port ID where drawing started (optional)
 * @param cursorPosition - The current cursor position
 * @returns The computed side for the floating end connection
 */
export const computeFloatingEndSide = (
  startNode: Node | undefined,
  startPort: string | undefined,
  cursorPosition: Point
): PortSide => {
  if (!startNode) {
    return 'left';
  }

  let startCenter: Point;

  if (startPort && startNode.measuredPorts) {
    const port = startNode.measuredPorts.find((p) => p.id === startPort);
    if (port?.position) {
      startCenter = {
        x: startNode.position.x + port.position.x + (port.size?.width ?? 0) / 2,
        y: startNode.position.y + port.position.y + (port.size?.height ?? 0) / 2,
      };
    } else {
      // Fallback to node center
      startCenter = {
        x: startNode.position.x + (startNode.size?.width ?? 100) / 2,
        y: startNode.position.y + (startNode.size?.height ?? 50) / 2,
      };
    }
  } else {
    // Use node center if no port specified
    startCenter = {
      x: startNode.position.x + (startNode.size?.width ?? 100) / 2,
      y: startNode.position.y + (startNode.size?.height ?? 50) / 2,
    };
  }

  const angle = NgDiagramMath.angleBetweenPoints(startCenter, cursorPosition);

  return NgDiagramMath.angleToSide(angle, true);
};

/**
 * Computes the optimal side for a floating start point (when drawing from empty space)
 * based on the direction toward the end point.
 *
 * @param floatingStartPosition - The floating start position
 * @param endPosition - The end position (cursor or target)
 * @returns The computed side for the floating start point
 */
export const computeFloatingStartSide = (floatingStartPosition: Point, endPosition: Point): PortSide => {
  const angle = NgDiagramMath.angleBetweenPoints(floatingStartPosition, endPosition);

  return NgDiagramMath.angleToSide(angle, false);
};
