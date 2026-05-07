import { Edge, Middleware, ModelActionTypes, Node, ZIndexConfig } from '../../../types';
import type { MiddlewareExecutor } from '../../middleware-executor';
import { assignEdgeZIndex } from './utils/assign-edges-z-index';
import { assignNodeZIndex } from './utils/assign-node-z-index';
import { createGroupChildrenMap } from './utils/create-group-children-map';
import { initializeZIndex } from './utils/initialize-z-index';

type Helpers = ReturnType<MiddlewareExecutor['helpers']>;

const checkIfIsInit = (modelActionTypes: ModelActionTypes) => modelActionTypes.includes('init');
const checkIfIsEdgeAdded = (modelActionTypes: ModelActionTypes) =>
  modelActionTypes.includes('finishLinking') || modelActionTypes.includes('addEdges');

/**
 * Phase 1: Collects directly changed node IDs.
 * No ancestor or descendant expansion — findEntryNodes and assignNodeZIndex handle that in Phase 2.
 */
function collectDirtyNodeIds(helpers: Helpers, nodesMap: Map<string, Node>): Set<string> {
  const dirtyNodeIds = new Set<string>();

  if (helpers.anyNodesAdded()) {
    for (const node of helpers.getAddedNodes()) {
      if (nodesMap.has(node.id)) dirtyNodeIds.add(node.id);
    }
  }
  for (const prop of ['selected', 'groupId', 'zOrder'] as const) {
    if (helpers.checkIfAnyNodePropsChanged([prop])) {
      for (const id of helpers.getAffectedNodeIds([prop])) {
        if (nodesMap.has(id)) dirtyNodeIds.add(id);
      }
    }
  }

  return dirtyNodeIds;
}

/** Phase 1 (edges): Collects edges that were added, changed, or connected to recomputed nodes. */
function collectDirtyEdgeIds(
  helpers: Helpers,
  recomputedNodesMap: Map<string, Node>,
  initialConnectedEdgesMap: Map<string, string[]>,
  isEdgeAdded: boolean,
  hasEdgeSelectionChange: boolean,
  hasEdgeZOrderChange: boolean
): Set<string> {
  const dirtyEdgeIds = new Set<string>();

  if (isEdgeAdded) {
    for (const edge of helpers.getAddedEdges()) dirtyEdgeIds.add(edge.id);
  }
  if (hasEdgeSelectionChange) {
    for (const id of helpers.getAffectedEdgeIds(['selected'])) dirtyEdgeIds.add(id);
  }
  if (hasEdgeZOrderChange) {
    for (const id of helpers.getAffectedEdgeIds(['zOrder'])) dirtyEdgeIds.add(id);
  }
  if (recomputedNodesMap.size > 0) {
    for (const nodeId of recomputedNodesMap.keys()) {
      for (const edgeId of initialConnectedEdgesMap.get(nodeId) ?? []) {
        dirtyEdgeIds.add(edgeId);
      }
    }
  }

  return dirtyEdgeIds;
}

/**
 * Finds the root-most entry points for z-index assignment.
 *
 * - Root dirty nodes (no parent) are entry points
 * - Grouped dirty nodes whose parent is also dirty are skipped (parent covers them)
 * - Grouped dirty nodes whose parent is NOT dirty use the parent as entry point,
 *   so siblings are processed together with proper sorting and slot assignment
 * - Orphaned nodes (parent missing from nodesMap) are treated as root entry points
 */
function findEntryNodes(dirtyNodeIds: Set<string>, nodesMap: Map<string, Node>): Node[] {
  const entryNodeIds = new Set<string>();
  for (const id of dirtyNodeIds) {
    const node = nodesMap.get(id);
    if (!node) continue;
    if (node.groupId == null) {
      entryNodeIds.add(id);
      continue;
    }
    if (dirtyNodeIds.has(node.groupId)) continue;
    entryNodeIds.add(nodesMap.has(node.groupId) ? node.groupId : id);
  }

  // Filter out entries whose ancestor is also an entry to avoid reprocessing subtrees
  const entryNodes: Node[] = [];
  for (const id of entryNodeIds) {
    const visited = new Set<string>();
    let ancestorId = nodesMap.get(id)?.groupId;
    let hasAncestorEntry = false;
    while (ancestorId != null && !visited.has(ancestorId)) {
      if (entryNodeIds.has(ancestorId)) {
        hasAncestorEntry = true;
        break;
      }
      visited.add(ancestorId);
      ancestorId = nodesMap.get(ancestorId)?.groupId;
    }
    if (!hasAncestorEntry) {
      const node = nodesMap.get(id);
      if (node) entryNodes.push(node);
    }
  }
  return entryNodes;
}

/**
 * Computes cumulative elevation for a node by walking its ancestor chain.
 * Counts selectedZIndex for each selected node from the node itself up to the root.
 */
function computeNodeElevation(node: Node, nodesMap: Map<string, Node>, zIndexConfig: ZIndexConfig): number {
  if (!zIndexConfig.elevateOnSelection) return 0;
  const visited = new Set<string>();
  let elevation = 0;
  let current: Node | undefined = node;
  while (current != null && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.selected) elevation += zIndexConfig.selectedZIndex;
    current = current.groupId != null ? nodesMap.get(current.groupId) : undefined;
  }
  return elevation;
}

/**
 * Phase 2: Computes z-indices for all entry nodes and their subtrees.
 *
 * Non-dirty entry nodes (promoted parents of dirty children) are left untouched —
 * their existing computedZIndex is preserved and only their children are recomputed.
 * The baked-in elevation is stripped from computedZIndex to recover the non-elevated base,
 * and cumulative elevation is passed to children so they inherit it correctly.
 *
 * Dirty entry nodes are always root or orphaned (no valid parent), so base starts at 0.
 */
function computeNodeZIndices(
  entryNodes: Node[],
  dirtyNodeIds: Set<string>,
  nodesMap: Map<string, Node>,
  childrenByGroupId: Map<string, Node[]>,
  zIndexConfig: ZIndexConfig
): { nodesWithZIndexMap: Map<string, Node>; nodeElevationMap: Map<string, number> } {
  const nodesWithZIndexMap = new Map<string, Node>();
  const nodeElevationMap = new Map<string, number>();

  for (const entryNode of entryNodes) {
    let baseZIndex: number;
    let options: { initialCumulativeElevation: number; skipRoot: boolean } | undefined;

    if (!dirtyNodeIds.has(entryNode.id) && entryNode.computedZIndex != null) {
      // Non-dirty promoted parent: preserve its computedZIndex, only recompute children.
      // Strip elevation to recover the non-elevated base for child slot assignment.
      const totalElevation = computeNodeElevation(entryNode, nodesMap, zIndexConfig);
      const ancestorElevation = totalElevation - (entryNode.selected ? zIndexConfig.selectedZIndex : 0);
      baseZIndex = entryNode.computedZIndex - totalElevation;
      options = { initialCumulativeElevation: ancestorElevation, skipRoot: true };
      nodeElevationMap.set(entryNode.id, totalElevation);
    } else {
      baseZIndex = 0;
    }

    const { nodes, elevations } = assignNodeZIndex(entryNode, childrenByGroupId, baseZIndex, zIndexConfig, options);
    for (const n of nodes) nodesWithZIndexMap.set(n.id, n);
    for (const [id, elev] of elevations) nodeElevationMap.set(id, elev);
  }

  return { nodesWithZIndexMap, nodeElevationMap };
}

/** Diffs computed z-indices against current state, returning only changed nodes. */
function diffNodeUpdates(
  nodesWithZIndexMap: Map<string, Node>,
  nodesMap: Map<string, Node>
): { id: string; computedZIndex: number | undefined }[] {
  const nodesToUpdate: { id: string; computedZIndex: number | undefined }[] = [];
  for (const node of nodesWithZIndexMap.values()) {
    const currentNode = nodesMap.get(node.id);
    if (!currentNode || node.computedZIndex === currentNode.computedZIndex) continue;
    nodesToUpdate.push({ id: node.id, computedZIndex: node.computedZIndex });
  }
  return nodesToUpdate;
}

/**
 * Computes edge z-index updates.
 *
 * Elevation: edges with explicit zOrder inherit connected node elevation (otherwise
 * it's already baked into the base from elevated node z-indices). Own selection adds selectedZIndex.
 */
function computeEdgeUpdates(
  dirtyEdgeIds: Set<string>,
  edgesMap: Map<string, Edge>,
  recomputedNodesMap: Map<string, Node>,
  nodesMap: Map<string, Node>,
  zIndexConfig: ZIndexConfig,
  nodeElevationMap: Map<string, number>
): { id: string; computedZIndex: number }[] {
  const edgesToUpdate: { id: string; computedZIndex: number }[] = [];
  const nodeZIndexMap = new Map<string, number>();
  for (const [id, node] of recomputedNodesMap) {
    nodeZIndexMap.set(id, node.computedZIndex ?? 0);
  }

  for (const edgeId of dirtyEdgeIds) {
    const edge = edgesMap.get(edgeId);
    if (!edge) continue;

    const edgeWithBase = assignEdgeZIndex(edge, nodeZIndexMap, nodesMap, zIndexConfig.edgesAboveConnectedNodes);
    let computedZIndex = edgeWithBase.computedZIndex ?? 0;

    if (zIndexConfig.elevateOnSelection) {
      if (edge.zOrder != null) {
        const sourceElevation = nodeElevationMap.get(edge.source) ?? 0;
        const targetElevation = nodeElevationMap.get(edge.target) ?? 0;
        computedZIndex += Math.max(sourceElevation, targetElevation);
      }
      if (edge.selected) computedZIndex += zIndexConfig.selectedZIndex;
    }

    if (computedZIndex !== edge.computedZIndex) {
      edgesToUpdate.push({ id: edge.id, computedZIndex });
    }
  }

  return edgesToUpdate;
}

/**
 * Z-index assignment middleware using a two-phase architecture:
 *
 * Phase 1 — Collect dirty sets: determines which directly changed nodes (added,
 * selected/groupId/zOrder changed) and their connected edges need z-index recomputation.
 * No ancestor or descendant expansion — entry node discovery and recursive assignment handle that.
 *
 * Phase 2 — Find entry nodes and assign: dirty nodes are promoted to root-most entry points
 * (root dirty nodes become entries; grouped dirty nodes promote their non-dirty parent so
 * siblings are re-sorted together; overlapping entries are pruned via ancestor walk).
 * Each entry subtree is processed through assignNodeZIndex with selection-aware sorting,
 * cumulative elevation, and independent child slot assignment. Non-dirty promoted parents
 * preserve their existing computedZIndex.
 *
 * Edge z-indices are computed from connected node z-indices, with elevation inherited
 * from connected nodes for edges with explicit zOrder.
 */
export const zIndexMiddleware: Middleware<'z-index'> = {
  name: 'z-index',
  execute: (context, next) => {
    const {
      state: { edges },
      nodesMap,
      edgesMap,
      initialConnectedEdgesMap,
      helpers,
      modelActionTypes,
      config,
    } = context;

    const zIndexConfig = config.zIndex;
    if (!zIndexConfig.enabled) {
      next();
      return;
    }

    const isInit = checkIfIsInit(modelActionTypes);
    const isEdgeAdded = checkIfIsEdgeAdded(modelActionTypes);
    const hasEdgeSelectionChange = helpers.checkIfAnyEdgePropsChanged(['selected']);
    const hasEdgeZOrderChange = helpers.checkIfAnyEdgePropsChanged(['zOrder']);

    let childrenByGroupId: Map<string, Node[]> | undefined;
    const getChildrenByGroupId = () => {
      childrenByGroupId ??= createGroupChildrenMap(nodesMap);
      return childrenByGroupId;
    };

    let nodesWithZIndexMap: Map<string, Node>;
    let nodeElevationMap: Map<string, number>;

    if (isInit) {
      const { nodes, elevations } = initializeZIndex(nodesMap, zIndexConfig, getChildrenByGroupId());
      nodesWithZIndexMap = new Map(nodes.map((n) => [n.id, n]));
      nodeElevationMap = elevations;
    } else {
      const dirtyNodeIds = collectDirtyNodeIds(helpers, nodesMap);

      if (dirtyNodeIds.size === 0 && !isEdgeAdded && !hasEdgeSelectionChange && !hasEdgeZOrderChange) {
        next();
        return;
      }

      if (dirtyNodeIds.size > 0) {
        const entryNodes = findEntryNodes(dirtyNodeIds, nodesMap);
        ({ nodesWithZIndexMap, nodeElevationMap } = computeNodeZIndices(
          entryNodes,
          dirtyNodeIds,
          nodesMap,
          getChildrenByGroupId(),
          zIndexConfig
        ));
      } else {
        nodesWithZIndexMap = new Map();
        nodeElevationMap = new Map();
      }
    }

    const nodesToUpdate = diffNodeUpdates(nodesWithZIndexMap, nodesMap);

    const dirtyEdgeIds = isInit
      ? new Set(edges.map((e) => e.id))
      : collectDirtyEdgeIds(
          helpers,
          nodesWithZIndexMap,
          initialConnectedEdgesMap,
          isEdgeAdded,
          hasEdgeSelectionChange,
          hasEdgeZOrderChange
        );

    const edgesToUpdate = computeEdgeUpdates(
      dirtyEdgeIds,
      edgesMap,
      nodesWithZIndexMap,
      nodesMap,
      zIndexConfig,
      nodeElevationMap
    );

    next({
      ...(nodesToUpdate.length > 0 ? { nodesToUpdate } : {}),
      ...(edgesToUpdate.length > 0 ? { edgesToUpdate } : {}),
    });
  },
};
