import { makeTreeLayout } from '../../utils/tree-layout/orientation-tree-layout.ts';
import {
  buildGroupsHierarchy,
  buildTopGroupMap,
  buildTreeStructure,
  getNodeMap,
  remapEdges,
} from '../../utils/tree-layout/build-tree-structure.ts';
import { FlowStateUpdate, Middleware, ModelActionType } from '../../types';
import { isAngleHorizontal } from '../../utils/get-direction.ts';
import { TreeLayoutConfig } from '../../types/tree-layout.interface.ts';

// Todo: Move this to metadata
const CONFIG: TreeLayoutConfig = {
  siblingGap: 50,
  levelGap: 100,
  layoutAngle: 90,
  layoutAlignment: 'Parent',
  autoLayout: false,
};

const checkIfShouldTreeLayout = (modelActionType: ModelActionType) => modelActionType === 'treeLayout';

export const treeLayoutMiddleware: Middleware = {
  name: 'tree-layout',
  execute: (context, next) => {
    const {
      state: { edges, nodes },
      modelActionType,
    } = context;
    const shouldTreeLayout = checkIfShouldTreeLayout(modelActionType);

    if (!shouldTreeLayout && !CONFIG.autoLayout) {
      next();
      return;
    }

    const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];
    const nodeMap = getNodeMap(nodes);
    const topGroupMap = buildTopGroupMap(nodeMap);
    const remappedEdges = remapEdges(edges, topGroupMap);

    buildGroupsHierarchy(nodeMap);
    const { roots } = buildTreeStructure(nodeMap, remappedEdges);

    const config = CONFIG;

    let offset = { x: 100, y: 100 };

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
      if (!currentNode || (node.position.x === currentNode.position.x && node.position.y === currentNode.position.y)) {
        continue;
      }
      nodesToUpdate.push({ id: currentNode.id, position: currentNode.position });
    }

    next({ ...(nodesToUpdate.length > 0 ? { nodesToUpdate } : {}) });
  },
};
