import { FlowStateUpdate, Middleware } from '../../../types';
import { getNodeMeasuredBounds } from '../../../utils/dimensions';
import type { TemplateVisibilityRegistry } from '../../../visibility/template-visibility-registry';
import { isNodeFullyMeasured } from './is-node-fully-measured';

/**
 * Creates a middleware that calculates and assigns measured bounds for nodes.
 *
 * Computes bounding boxes that encompass each node including its ports,
 * accounting for rotation. Only processes fully measured nodes (valid size, position,
 * and all visible ports measured). Template-hidden ports never measure — they
 * neither block bounds assignment nor extend the bounds.
 */
export const createMeasuredBoundsMiddleware = (
  templateVisibilityRegistry?: TemplateVisibilityRegistry
): Middleware<'measured-bounds'> => ({
  name: 'measured-bounds',
  execute: (context, next) => {
    const { nodesMap, modelActionTypes, helpers } = context;

    if (modelActionTypes.includes('init')) {
      const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];
      nodesMap.forEach((node) => {
        if (isNodeFullyMeasured(node, templateVisibilityRegistry)) {
          nodesToUpdate.push({
            id: node.id,
            measuredBounds: getNodeMeasuredBounds(node, templateVisibilityRegistry),
          });
        }
      });

      next({
        ...(nodesToUpdate.length ? { nodesToUpdate } : {}),
      });
      return;
    }

    if (
      !helpers.anyNodesAdded() &&
      !helpers.checkIfAnyNodePropsChanged(['position', 'size', 'angle', 'measuredPorts'])
    ) {
      next();
      return;
    }

    const nodesToAdd: FlowStateUpdate['nodesToAdd'] = [];
    const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];

    if (helpers.anyNodesAdded()) {
      const addedNodes = helpers.getAddedNodes();
      for (const node of addedNodes) {
        if (isNodeFullyMeasured(node, templateVisibilityRegistry)) {
          nodesToAdd.push({
            ...node,
            measuredBounds: getNodeMeasuredBounds(node, templateVisibilityRegistry),
          });
        }
      }
    }

    if (helpers.checkIfAnyNodePropsChanged(['position', 'size', 'angle', 'measuredPorts'])) {
      const affectedNodeIds = helpers.getAffectedNodeIds(['position', 'size', 'angle', 'measuredPorts']);
      for (const nodeId of affectedNodeIds) {
        const node = nodesMap.get(nodeId);
        if (node && isNodeFullyMeasured(node, templateVisibilityRegistry)) {
          nodesToUpdate.push({
            id: node.id,
            measuredBounds: getNodeMeasuredBounds(node, templateVisibilityRegistry),
          });
        }
      }
    }

    next({
      ...(nodesToAdd.length ? { nodesToAdd } : {}),
      ...(nodesToUpdate.length ? { nodesToUpdate } : {}),
    });
  },
});
