import { Edge, FlowStateUpdate, Middleware, ModelActionType, Node } from '../../../types';
import { DEFAULT_SELECTED_Z_ORDER } from './constants.ts';
import { initializeZOrder } from './utils/initializeZOrder.ts';
import { assignEdgeZOrder } from './utils/assignEdgeZOrder.ts';
import { assignNodeZOrder } from './utils/assignNodeZOrder.ts';

export interface ZOrderMiddlewareMetadata {
  enabled: boolean;
}

const checkIfIsInit = (modelActionType: ModelActionType) => modelActionType === 'init';
const checkIfIsEdgeAdded = (modelActionType: ModelActionType) => modelActionType === 'finishLinking';

export const zOrderMiddleware: Middleware<'z-order', ZOrderMiddlewareMetadata> = {
  name: 'z-order',
  defaultMetadata: {
    enabled: true,
  },
  execute: (context, next) => {
    const {
      state: { edges, metadata, nodes },
      nodesMap,
      helpers,
      modelActionType,
    } = context;
    // Access the typed middleware metadata
    const isEnabled = context.middlewareMetadata.enabled;
    const isInit = checkIfIsInit(modelActionType);
    const shouldSnap = helpers.checkIfAnyNodePropsChanged(['selected', 'groupId']);
    const isEdgeAdded = checkIfIsEdgeAdded(modelActionType);
    const shouldReOrder = isInit || shouldSnap || isEdgeAdded;

    if (!isEnabled || !shouldReOrder) {
      next();
      return;
    }

    const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];
    const edgesToUpdate: FlowStateUpdate['edgesToUpdate'] = [];
    let nodesWithZOrder: Node[] = [];
    let edgesWithZOrder: Edge[] = [];

    if (isInit) {
      nodesWithZOrder = initializeZOrder(nodesMap);
    }

    if (shouldSnap) {
      const selectedZOrder = metadata.selectedZOrder || DEFAULT_SELECTED_Z_ORDER;

      ['selected', 'groupId'].forEach((prop) => {
        if (!helpers.checkIfAnyNodePropsChanged([prop])) return;
        for (const nodeId of helpers.getAffectedNodeIds([prop])) {
          const node = nodesMap.get(nodeId);
          if (!node) continue;
          if (prop === 'groupId' && node.selected) continue;

          let baseZOrder = 0;
          if (prop === 'selected' && node.selected) {
            baseZOrder = selectedZOrder;
          } else if (node.groupId) {
            baseZOrder = (nodesMap.get(node.groupId)?.zOrder ?? -1) + 1;
          }
          assignNodeZOrder(node, nodesMap, nodesWithZOrder, baseZOrder);
        }
      });
    }

    for (const node of nodesWithZOrder) {
      const currentNode = nodes.find((layoutNode) => layoutNode.id === node.id);
      if (!currentNode || node.zOrder === currentNode.zOrder) {
        continue;
      }
      nodesToUpdate.push({ id: node.id, zOrder: node.zOrder });
    }

    if (isEdgeAdded) {
      edgesWithZOrder = assignEdgeZOrder([edges[edges.length - 1]], nodesWithZOrder, nodesMap);
    } else edgesWithZOrder = assignEdgeZOrder(edges, nodesWithZOrder, nodesMap);

    for (const edge of edgesWithZOrder) {
      const currentEdge = edges.find((layoutNode) => layoutNode.id === edge.id);
      if (!currentEdge || edge.zOrder === currentEdge.zOrder) {
        continue;
      }
      edgesToUpdate.push({ id: edge.id, zOrder: edge.zOrder });
    }

    next({
      ...(nodesToUpdate.length > 0 ? { nodesToUpdate } : {}),
      ...(edgesToUpdate.length > 0 ? { edgesToUpdate } : {}),
    });
  },
};
