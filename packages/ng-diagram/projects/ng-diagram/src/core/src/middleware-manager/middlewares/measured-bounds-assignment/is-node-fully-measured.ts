import { Node } from '../../../types';
import { isValidPosition, isValidSize } from '../../../utils/measurement-validation';

/**
 * Checks if a node is fully measured and ready for measured bounds calculation.
 * A node is considered fully measured when:
 * - Node has valid size (width > 0, height > 0)
 * - Node has valid position (x and y are not null/undefined)
 * - All ports (if any) have valid size and position
 *
 * @param node - The node to check
 * @returns true if the node is fully measured, false otherwise
 */
export const isNodeFullyMeasured = (node: Node): boolean => {
  if (!isValidSize(node.size) || !isValidPosition(node.position)) {
    return false;
  }

  if (node.measuredPorts) {
    for (const port of node.measuredPorts) {
      if (!isValidSize(port.size) || !isValidPosition(port.position)) {
        return false;
      }
    }
  }

  return true;
};
