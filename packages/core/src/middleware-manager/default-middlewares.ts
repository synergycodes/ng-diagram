import { Middleware } from '../types';
import { edgesRoutingMiddleware } from './middlewares/edges-routing/edges-routing';
import { groupChildrenChangeExtent } from './middlewares/group-children-change-extent';
import { groupChildrenMoveExtent } from './middlewares/group-children-move-extent';
import { nodePositionSnapMiddleware } from './middlewares/node-position-snap';
import { nodeRotationSnapMiddleware } from './middlewares/node-rotation-snap';
import { treeLayoutMiddleware } from './middlewares/tree-layout/tree-layout';

export const defaultMiddlewares = [
  nodeRotationSnapMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  treeLayoutMiddleware,
  edgesRoutingMiddleware,
  nodePositionSnapMiddleware,
] as const satisfies Middleware[];
