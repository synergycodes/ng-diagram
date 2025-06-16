import { horizontalTreeLayout, verticalTreeLayout } from '../../utils/orientation-tree-layout.ts';
import { buildTreeStructure } from '../../utils/build-tree-structure.ts';
import { FlowStateUpdate, Middleware, ModelActionType, TreeLayoutConfig } from '../../types';

// Todo: Move this to metadata
const CONFIG: TreeLayoutConfig = { siblingGap: 100, levelGap: 100, orientation: 'Horizontal' };

const checkIfShouldTreeLayout = (modelActionType: ModelActionType) => modelActionType === 'treeLayout';

export const treeLayoutMiddleware: Middleware = {
  name: 'tree-layout',
  execute: (context, next) => {
    const {
      state: { edges, nodes },
      modelActionType,
    } = context;
    const shouldTreeLayout = checkIfShouldTreeLayout(modelActionType);

    if (!shouldTreeLayout) {
      next();
      return;
    }
    const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];

    const { nodeMap, roots } = buildTreeStructure(nodes, edges);
    const config = CONFIG;
    let offsetY = 100;
    let offsetX = 100;

    roots.forEach((root) => {
      const isHorizontal = config.orientation === 'Horizontal';
      const hasChildren = root.children.length > 0;
      const nodeSize = isHorizontal ? root.size?.height || 0 : root.size?.width || 0;

      if (isHorizontal) {
        const currentRootOffset = horizontalTreeLayout(root, config, offsetX, offsetY);
        offsetY = currentRootOffset + config.siblingGap + (hasChildren ? 0 : nodeSize);
      } else {
        const currentRootOffset = verticalTreeLayout(root, config, offsetX, offsetY);
        offsetX = currentRootOffset + config.siblingGap + (hasChildren ? 0 : nodeSize);
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
      nodesToUpdate.push(currentNode);
    }

    next({ ...(nodesToUpdate.length > 0 ? { nodesToUpdate } : {}) });
  },
};
