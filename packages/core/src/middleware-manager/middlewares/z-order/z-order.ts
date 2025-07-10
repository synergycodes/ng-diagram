import { Edge, FlowStateUpdate, Middleware, ModelActionType, Node } from '../../../types';
import { DEFAULT_SELECTED_Z_ORDER } from './constants.ts';
import { initializeZOrder } from './utils/initialize-z-order.ts';
import { assignEdgesZOrder, assignEdgeZOrder } from './utils/assign-edges-z-order.ts';
import { assignNodeZOrder } from './utils/assign-node-z-order.ts';

export interface ZOrderMiddlewareMetadata {
  enabled: boolean;
  selectedZOrder: number;
}

const checkIfIsInit = (modelActionType: ModelActionType) => modelActionType === 'init';
const checkIfIsEdgeAdded = (modelActionType: ModelActionType) => modelActionType === 'finishLinking';

export const zOrderMiddleware: Middleware<'z-order', ZOrderMiddlewareMetadata> = {
  name: 'z-order',
  defaultMetadata: {
    enabled: true,
    selectedZOrder: DEFAULT_SELECTED_Z_ORDER,
  },
  execute: (context, next) => {
    const {
      state: { edges, nodes },
      nodesMap,
      edgesMap,
      helpers,
      modelActionType,
      middlewareMetadata,
    } = context;
    // Access the typed middleware metadata
    const isEnabled = middlewareMetadata.enabled;
    const isInit = checkIfIsInit(modelActionType);
    const shouldSnapSelectedNode = helpers.checkIfAnyNodePropsChanged(['selected']);
    const shouldSnapGroupIdNode = helpers.checkIfAnyNodePropsChanged(['groupId']);
    const shouldSnapEdge = helpers.checkIfAnyEdgePropsChanged(['selected']);
    const isEdgeAdded = checkIfIsEdgeAdded(modelActionType);
    const shouldReOrder = isInit || shouldSnapGroupIdNode || shouldSnapSelectedNode || isEdgeAdded || shouldSnapEdge;

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
    const selectedZOrder = middlewareMetadata.selectedZOrder;

    if (shouldSnapSelectedNode) {
      for (const nodeId of helpers.getAffectedNodeIds(['selected'])) {
        const node = nodesMap.get(nodeId);
        if (!node) continue;
        let baseZOrder = node.selected
          ? selectedZOrder
          : node.groupId
            ? (nodesMap.get(node.groupId)?.zOrder ?? -1) + 1
            : 0;
        nodesWithZOrder.push(...assignNodeZOrder(node, nodesMap, baseZOrder));
      }
    } else if (shouldSnapGroupIdNode) {
      for (const nodeId of helpers.getAffectedNodeIds(['groupId'])) {
        const node = nodesMap.get(nodeId);
        if (!node || node?.selected) continue;
        let baseZOrder = 0;
        if (node.groupId) {
          baseZOrder = (nodesMap.get(node.groupId)?.zOrder ?? -1) + 1;
        }
        nodesWithZOrder.push(...assignNodeZOrder(node, nodesMap, baseZOrder));
      }
    }

    for (const node of nodesWithZOrder) {
      const currentNode = nodes.find((nodeData) => nodeData.id === node.id);
      if (!currentNode || node.zOrder === currentNode.zOrder) {
        continue;
      }
      nodesToUpdate.push({ id: node.id, zOrder: node.zOrder });
    }

    let newTemporaryEdge: Edge | undefined = undefined;

    if (isEdgeAdded) {
      edgesWithZOrder = assignEdgesZOrder([edges[edges.length - 1]], nodesWithZOrder, nodesMap);
    }

    if (shouldSnapEdge) {
      const zOrderMap = new Map(nodesWithZOrder.map((n) => [n.id, n.zOrder ?? 0]));

      for (const edgeId of helpers.getAffectedEdgeIds(['selected'])) {
        const edge = edgesMap.get(edgeId);
        if (!edge) continue;
        edgesWithZOrder.push(
          edge.selected
            ? {
                ...edge,
                zOrder: selectedZOrder,
              }
            : assignEdgeZOrder(edge, zOrderMap, nodesMap)
        );
      }
    } else edgesWithZOrder = assignEdgesZOrder(edges, nodesWithZOrder, nodesMap);

    for (const edge of edgesWithZOrder) {
      const currentEdge = edges.find((edgeData) => edgeData.id === edgeData.id);
      if (!currentEdge || edge.zOrder === currentEdge.zOrder) {
        continue;
      }
      edgesToUpdate.push({ id: edge.id, zOrder: edge.zOrder });
    }

    next({
      ...(nodesToUpdate.length > 0 ? { nodesToUpdate } : {}),
      ...(edgesToUpdate.length > 0 ? { edgesToUpdate } : {}),
      ...(newTemporaryEdge ? { metadataUpdate: { temporaryEdge: newTemporaryEdge } } : {}),
    });
  },
};
