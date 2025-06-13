import { horizontalTreeLayout, verticalTreeLayout } from '../../utils/orientation-tree-layout.ts';
import { buildTreeStructure } from '../../utils/build-tree-structure.ts';
import { FlowStateUpdate, Middleware, TreeLayoutConfig } from '../../types';

// Todo: Move this to metadata
const CONFIG: TreeLayoutConfig = { siblingGap: 100, levelGap: 100, orientation: 'Horizontal' };

export const treeLayoutMiddleware: Middleware = {
  name: 'tree-layout',
  execute: (context, next) => {
    const {
      state: { edges, nodes },
    } = context;
    const { nodeMap, roots } = buildTreeStructure(nodes, edges);
    const config = CONFIG;
    let offsetY = 100;
    let offsetX = 100;

    roots.forEach((root) => {
      if (config.orientation === 'Horizontal') {
        const currentRootOffset = horizontalTreeLayout(root, config, offsetX, offsetY);
        const rootHeight = root.size?.height || 0;
        const hasChildren = root.children.length > 0 ? 0 : rootHeight;
        offsetY = currentRootOffset + config.siblingGap + hasChildren;
      } else {
        const currentRootOffset = verticalTreeLayout(root, config, offsetX, offsetY);
        const rootWidth = root.size?.width || 0;
        const hasChildren = root.children.length > 0 ? 0 : rootWidth;
        offsetX = currentRootOffset + config.siblingGap + hasChildren;
      }
    });

    const nodeList = Array.from(nodeMap.values());
    const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];
    for (const node of nodes) {
      if (!node.position) {
        continue;
      }

      const currentNode = nodeList.find((layoutNode) => layoutNode.id === node.id);
      if (!currentNode) {
        continue;
      }
      nodesToUpdate.push(currentNode);
    }

    next({ ...(nodesToUpdate.length > 0 ? { nodesToUpdate } : {}) });
  },
};
