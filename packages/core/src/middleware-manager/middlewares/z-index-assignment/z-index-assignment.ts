import { Edge, FlowStateUpdate, Middleware, ModelActionType, Node } from '../../../types';
import { DEFAULT_SELECTED_Z_INDEX } from './constants.ts';
import { assignEdgesZIndex, assignEdgeZIndex } from './utils/assign-edges-z-index.ts';
import { assignNodeZIndex } from './utils/assign-node-z-index.ts';
import { initializeZIndex } from './utils/initialize-z-index.ts';

export interface ZIndexMiddlewareMetadata {
  enabled: boolean;
  selectedZIndex: number;
}

const checkIfIsInit = (modelActionType: ModelActionType) => modelActionType === 'init';
const checkIfIsEdgeAdded = (modelActionType: ModelActionType) => modelActionType === 'finishLinking';

export const zIndexMiddleware: Middleware<'z-index', ZIndexMiddlewareMetadata> = {
  name: 'z-index',
  defaultMetadata: {
    enabled: true,
    selectedZIndex: DEFAULT_SELECTED_Z_INDEX,
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
    const shouldSnapZOrderNode = helpers.checkIfAnyNodePropsChanged(['zOrder']);
    const shouldSnapEdge = helpers.checkIfAnyEdgePropsChanged(['selected']);
    const isEdgeAdded = checkIfIsEdgeAdded(modelActionType);
    const shouldReOrder =
      isInit ||
      shouldSnapGroupIdNode ||
      shouldSnapSelectedNode ||
      isEdgeAdded ||
      shouldSnapEdge ||
      shouldSnapZOrderNode;

    if (!isEnabled || !shouldReOrder) {
      next();
      return;
    }

    const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];
    const edgesToUpdate: FlowStateUpdate['edgesToUpdate'] = [];
    let nodesWithZIndex: Node[] = [];
    const processedNodeIds = new Set<string>();
    let edgesWithZIndex: Edge[] = [];

    if (isInit) {
      nodesWithZIndex = initializeZIndex(nodesMap);
      nodesWithZIndex.forEach((node) => processedNodeIds.add(node.id));
    }
    const selectedZIndex = middlewareMetadata.selectedZIndex;

    // Partial for Node
    if (shouldSnapSelectedNode) {
      for (const nodeId of helpers.getAffectedNodeIds(['selected'])) {
        if (processedNodeIds.has(nodeId)) {
          // If the node is already processed, skip it
          continue;
        }
        const node = nodesMap.get(nodeId);
        if (!node) continue;
        const baseZIndex = node.selected
          ? selectedZIndex
          : node.groupId
            ? (nodesMap.get(node.groupId)?.zIndex ?? -1) + 1
            : 0;
        const assignedNodes = assignNodeZIndex(node, nodesMap, baseZIndex, node.selected);
        nodesWithZIndex.push(...assignedNodes);
        assignedNodes.forEach((n) => processedNodeIds.add(n.id));
      }
    } else if (shouldSnapGroupIdNode) {
      for (const nodeId of helpers.getAffectedNodeIds(['groupId'])) {
        if (processedNodeIds.has(nodeId)) {
          // If the node is already processed, skip it
          continue;
        }
        const node = nodesMap.get(nodeId);
        if (!node || node?.selected) continue;
        const baseZIndex = node.groupId ? (nodesMap.get(node.groupId)?.zIndex ?? -1) + 1 : 0;
        const assignedNodes = assignNodeZIndex(node, nodesMap, baseZIndex);
        nodesWithZIndex.push(...assignedNodes);
        assignedNodes.forEach((n) => processedNodeIds.add(n.id));
      }
    }

    if (shouldSnapZOrderNode) {
      for (const nodeId of helpers.getAffectedNodeIds(['zOrder'])) {
        const node = nodesMap.get(nodeId);
        if (!node) continue;
        nodesWithZIndex.push({ ...node, zIndex: node.zOrder });
        processedNodeIds.add(node.id);
      }
    }

    for (const node of nodesWithZIndex) {
      const currentNode = nodes.find((nodeData) => nodeData.id === node.id);
      if (!currentNode || node.zIndex === currentNode.zIndex) {
        continue;
      }
      nodesToUpdate.push({ id: node.id, zIndex: node.zIndex });
    }

    const addedEdge = edges.at(-1);
    // Partial for Edge
    if (isEdgeAdded && addedEdge) {
      edgesWithZIndex = assignEdgesZIndex([addedEdge], nodesWithZIndex, nodesMap);
    }

    if (shouldSnapEdge) {
      const zIndexMap = new Map(nodesWithZIndex.map((n) => [n.id, n.zIndex ?? 0]));

      for (const edgeId of helpers.getAffectedEdgeIds(['selected'])) {
        const edge = edgesMap.get(edgeId);
        if (!edge) continue;
        edgesWithZIndex.push(
          edge.selected
            ? {
                ...edge,
                zIndex: selectedZIndex,
              }
            : assignEdgeZIndex(edge, zIndexMap, nodesMap)
        );
      }
    } else edgesWithZIndex = assignEdgesZIndex(edges, nodesWithZIndex, nodesMap);

    for (const edge of edgesWithZIndex) {
      const currentEdge = edges.find((edgeData) => edgeData.id === edge.id);
      if (!currentEdge || edge.zIndex === currentEdge.zIndex) {
        continue;
      }
      edgesToUpdate.push({ id: edge.id, zIndex: edge.zIndex });
    }

    next({
      ...(nodesToUpdate.length > 0 ? { nodesToUpdate } : {}),
      ...(edgesToUpdate.length > 0 ? { edgesToUpdate } : {}),
    });
  },
};
