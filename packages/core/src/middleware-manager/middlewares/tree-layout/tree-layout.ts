import { FlowStateUpdate, Middleware, type MiddlewareContext, ModelActionType } from '../../../types';
import { isAngleHorizontal, isSamePoint } from '../../../utils';
import { TREE_LAYOUT_DEFAULT_CONFIG } from './constants.ts';
import {
  buildGroupsHierarchy,
  buildTopGroupMap,
  buildTreeStructure,
  getNodeMap,
  remapEdges,
} from './utils/build-tree-structure.ts';
import { makeTreeLayout } from './utils/orientation-tree-layout.ts';

const checkIfShouldAutoTreeLayout = ({ helpers, modelActionType }: MiddlewareContext) =>
  modelActionType === 'init' ||
  helpers.anyEdgesAdded() ||
  helpers.anyEdgesRemoved() ||
  helpers.checkIfAnyNodePropsChanged(['position', 'size']);

const checkIfShouldTreeLayout = (modelActionType: ModelActionType) => modelActionType === 'treeLayout';

export const treeLayoutMiddleware: Middleware = {
  name: 'tree-layout',
  execute: (context, next) => {
    const {
      state: { edges, nodes, metadata },
      modelActionType,
    } = context;
    const shouldTreeLayout = checkIfShouldTreeLayout(modelActionType);
    const shouldAutoLayout = checkIfShouldAutoTreeLayout(context);
    const config = { ...TREE_LAYOUT_DEFAULT_CONFIG, ...(metadata.layoutConfiguration || {}) };

    if (!config || (!shouldTreeLayout && (!config?.autoLayout || !shouldAutoLayout))) {
      next();
      return;
    }

    const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];
    const nodeMap = getNodeMap(context.flowCore.config.treeLayout, nodes);
    const topGroupMap = buildTopGroupMap(nodeMap);
    const remappedEdges = remapEdges(edges, topGroupMap);

    buildGroupsHierarchy(nodeMap);
    const { roots } = buildTreeStructure(nodeMap, remappedEdges);

    const offset = { x: 100, y: 100 };

    const isHorizontal = isAngleHorizontal(config.layoutAngle);
    roots.forEach((root) => {
      const subtreeBounds = makeTreeLayout(root, config, offset.x, offset.y, config.layoutAngle);

      const subtreeSizeAlongCross = isHorizontal
        ? subtreeBounds.maxY - subtreeBounds.minY
        : subtreeBounds.maxX - subtreeBounds.minX;

      if (isHorizontal) {
        offset.y += subtreeSizeAlongCross + config.siblingGap;
      } else {
        offset.x += subtreeSizeAlongCross + config.siblingGap;
      }
    });

    const nodeList = Array.from(nodeMap.values());
    for (const node of nodes) {
      if (!node.position) {
        continue;
      }

      const currentNode = nodeList.find((layoutNode) => layoutNode.id === node.id);
      if (!currentNode || isSamePoint(node.position, currentNode.position)) {
        continue;
      }
      nodesToUpdate.push({ id: currentNode.id, position: currentNode.position });
    }

    next({ ...(nodesToUpdate.length > 0 ? { nodesToUpdate } : {}) });
  },
};
