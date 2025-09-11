import { FlowStateUpdate, Middleware, type MiddlewareContext, ModelActionType } from '../../../types';
import { isAngleHorizontal, isSamePoint } from '../../../utils';
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
      state: { edges, nodes },
      modelActionType,
      flowCore,
    } = context;
    const shouldTreeLayout = checkIfShouldTreeLayout(modelActionType);
    const shouldAutoLayout = checkIfShouldAutoTreeLayout(context);
    const config = flowCore.config.treeLayout;

    if (!config || (!shouldTreeLayout && (!config?.autoLayout || !shouldAutoLayout))) {
      next();
      return;
    }

    const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];
    const treeNodeMap = getNodeMap(config, nodes);
    const topGroupMap = buildTopGroupMap(treeNodeMap);
    const remappedEdges = remapEdges(edges, topGroupMap);

    buildGroupsHierarchy(treeNodeMap);
    const { roots } = buildTreeStructure(treeNodeMap, remappedEdges);

    const isHorizontal = isAngleHorizontal(config.layoutAngle);
    let isFirstRoot = true;
    let previousBounds: { minX: number; maxX: number; minY: number; maxY: number } | null = null;
    const baseX = 100;
    const baseY = 100;

    roots.forEach((root) => {
      let offsetX = baseX;
      let offsetY = baseY;

      if (!isFirstRoot && previousBounds) {
        if (isHorizontal) {
          offsetX = baseX;
          offsetY = previousBounds.maxY + config.treeGap;
        } else {
          offsetX = previousBounds.maxX + config.treeGap;
          offsetY = baseY;
        }
      }

      const subtreeBounds = makeTreeLayout(root, config, offsetX, offsetY, config.layoutAngle);
      previousBounds = subtreeBounds;
      isFirstRoot = false;
    });

    const nodeList = Array.from(treeNodeMap.values());
    for (const node of nodes) {
      const currentNode = nodeList.find((layoutNode) => layoutNode.id === node.id);
      if (!currentNode) {
        continue;
      }

      if (!node.position || !isSamePoint(node.position, currentNode.position)) {
        nodesToUpdate.push({ id: currentNode.id, position: currentNode.position });
      }
    }

    next({ ...(nodesToUpdate.length > 0 ? { nodesToUpdate } : {}) });
  },
};
