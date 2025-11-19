import { Edge, FlowStateUpdate, Middleware, ModelActionType, Node } from '../../../types';
import { assignEdgesZIndex, assignEdgeZIndex } from './utils/assign-edges-z-index';
import { assignNodeZIndex } from './utils/assign-node-z-index';
import { initializeZIndex } from './utils/initialize-z-index';

const checkIfIsInit = (modelActionType: ModelActionType) => modelActionType === 'init';
const checkIfIsEdgeAdded = (modelActionType: ModelActionType) =>
  modelActionType === 'finishLinking' || modelActionType === 'addEdges';

export const zIndexMiddleware: Middleware<'z-index'> = {
  name: 'z-index',
  execute: (context, next) => {
    const {
      state: { edges, nodes },
      nodesMap,
      edgesMap,
      helpers,
      modelActionType,
      config,
    } = context;

    const zIndexConfig = config.zIndex;
    const isEnabled = zIndexConfig.enabled;
    const isInit = checkIfIsInit(modelActionType);
    const shouldSnapSelectedNode = helpers.checkIfAnyNodePropsChanged(['selected']);
    const shouldSnapGroupIdNode = helpers.checkIfAnyNodePropsChanged(['groupId']);
    const shouldSnapZOrderNode = helpers.checkIfAnyNodePropsChanged(['zOrder']);
    const shouldSnapEdge = helpers.checkIfAnyEdgePropsChanged(['selected']);
    const isEdgeAdded = checkIfIsEdgeAdded(modelActionType);
    const isNodeAdded = helpers.anyNodesAdded();
    const shouldReOrder =
      isInit ||
      shouldSnapGroupIdNode ||
      shouldSnapSelectedNode ||
      isEdgeAdded ||
      shouldSnapEdge ||
      shouldSnapZOrderNode ||
      isNodeAdded;

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

    if (isNodeAdded) {
      nodesWithZIndex = [
        ...nodesWithZIndex,
        ...initializeZIndex(
          helpers.getAddedNodes().reduce((map, node) => map.set(node.id, node), new Map<string, Node>())
        ),
      ];
    }

    const selectedZIndex = zIndexConfig.selectedZIndex;

    const getGroupCurrentZIndex = (node: Node): number => {
      return node.groupId
        ? ((nodesWithZIndex.find((n) => n.id === node.groupId) ?? nodesMap.get(node.groupId))?.computedZIndex ?? -1)
        : -1;
    };

    const sortWithGroupBefore = (a: string, b: string) => {
      const nodeA = nodesMap.get(a);
      const nodeB = nodesMap.get(b);
      if (!nodeA || !nodeB) return 0;

      if (nodeA.groupId && nodeA.groupId === nodeB.id) {
        return 1;
      } else if (nodeB.groupId && nodeB.groupId === nodeA.id) {
        return -1;
      }
      return 0;
    };

    // Partial for Node
    if (shouldSnapSelectedNode) {
      for (const nodeId of helpers.getAffectedNodeIds(['selected']).sort(sortWithGroupBefore)) {
        if (processedNodeIds.has(nodeId)) {
          // If the node is already processed, skip it
          continue;
        }
        const node = nodesMap.get(nodeId);
        if (!node) continue;
        const baseZIndex =
          node.selected && zIndexConfig.elevateOnSelection
            ? node.groupId
              ? getGroupCurrentZIndex(node) + 1
              : selectedZIndex
            : node.zOrder !== undefined
              ? node.zOrder
              : node.groupId
                ? getGroupCurrentZIndex(node) + 1
                : 0;
        const assignedNodes = assignNodeZIndex(
          node,
          nodesMap,
          baseZIndex,
          node.selected && zIndexConfig.elevateOnSelection
        );
        nodesWithZIndex.push(...assignedNodes);
        assignedNodes.forEach((n) => processedNodeIds.add(n.id));
      }
    } else if (shouldSnapGroupIdNode) {
      for (const nodeId of helpers.getAffectedNodeIds(['groupId']).sort(sortWithGroupBefore)) {
        if (processedNodeIds.has(nodeId)) {
          // If the node is already processed, skip it
          continue;
        }
        const node = nodesMap.get(nodeId);
        if (!node || node?.selected) continue;
        const baseZIndex = node.groupId ? getGroupCurrentZIndex(node) + 1 : 0;
        const assignedNodes = assignNodeZIndex(node, nodesMap, baseZIndex, node.selected);
        nodesWithZIndex.push(...assignedNodes);
        assignedNodes.forEach((n) => processedNodeIds.add(n.id));
      }
    }

    if (shouldSnapZOrderNode) {
      for (const nodeId of helpers.getAffectedNodeIds(['zOrder']).sort(sortWithGroupBefore)) {
        const node = nodesMap.get(nodeId);
        if (!node) continue;
        nodesWithZIndex.push({ ...node, computedZIndex: node.zOrder });
        processedNodeIds.add(node.id);
      }
    }

    for (const node of nodesWithZIndex) {
      const currentNode = nodes.find((nodeData) => nodeData.id === node.id);
      if (!currentNode || node.computedZIndex === currentNode.computedZIndex) {
        continue;
      }
      nodesToUpdate.push({ id: node.id, computedZIndex: node.computedZIndex });
    }

    const addedEdge = edges.at(-1);
    // Partial for Edge
    if (isEdgeAdded && addedEdge) {
      edgesWithZIndex = assignEdgesZIndex(
        [addedEdge],
        nodesWithZIndex,
        nodesMap,
        zIndexConfig.edgesAboveConnectedNodes
      );
    }

    if (shouldSnapEdge) {
      const zIndexMap = new Map(nodesWithZIndex.map((n) => [n.id, n.computedZIndex ?? 0]));

      for (const edgeId of helpers.getAffectedEdgeIds(['selected'])) {
        const edge = edgesMap.get(edgeId);
        if (!edge) continue;
        edgesWithZIndex.push(
          edge.selected && zIndexConfig.elevateOnSelection
            ? {
                ...edge,
                computedZIndex: selectedZIndex,
              }
            : assignEdgeZIndex(edge, zIndexMap, nodesMap, zIndexConfig.edgesAboveConnectedNodes)
        );
      }
    } else edgesWithZIndex = assignEdgesZIndex(edges, nodesWithZIndex, nodesMap, zIndexConfig.edgesAboveConnectedNodes);

    for (const edge of edgesWithZIndex) {
      const currentEdge = edges.find((edgeData) => edgeData.id === edge.id);
      if (!currentEdge || edge.computedZIndex === currentEdge.computedZIndex) {
        continue;
      }
      edgesToUpdate.push({ id: edge.id, computedZIndex: edge.computedZIndex });
    }

    next({
      ...(nodesToUpdate.length > 0 ? { nodesToUpdate } : {}),
      ...(edgesToUpdate.length > 0 ? { edgesToUpdate } : {}),
    });
  },
};
