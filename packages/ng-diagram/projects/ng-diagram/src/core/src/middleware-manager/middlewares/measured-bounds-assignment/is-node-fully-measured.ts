import { Node } from '../../../types';
import { isValidPosition, isValidSize } from '../../../utils/measurement-validation';
import type { TemplateVisibilityRegistry } from '../../../visibility/template-visibility-registry';

/**
 * Checks if a node is fully measured and ready for measured bounds calculation.
 * A node is considered fully measured when:
 * - Node has valid size (width > 0, height > 0)
 * - Node has valid position (x and y are not null/undefined)
 * - All visible ports (if any) have valid size and position — template-hidden
 *   ports are display: none, never measure, and must not block bounds
 *   assignment forever
 *
 * @param node - The node to check
 * @param templateVisibilityRegistry - Registry of template-declared hidden state
 * @returns true if the node is fully measured, false otherwise
 */
export const isNodeFullyMeasured = (node: Node, templateVisibilityRegistry?: TemplateVisibilityRegistry): boolean => {
  if (!isValidSize(node.size) || !isValidPosition(node.position)) {
    return false;
  }

  if (node.measuredPorts) {
    for (const port of node.measuredPorts) {
      if (templateVisibilityRegistry?.isPortHidden(node.id, port.id)) {
        continue;
      }
      if (!isValidSize(port.size) || !isValidPosition(port.position)) {
        return false;
      }
    }
  }

  return true;
};
