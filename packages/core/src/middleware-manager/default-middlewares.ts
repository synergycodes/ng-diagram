import { Middleware } from '../types';
import { edgesStraightRoutingMiddleware } from './middlewares/edges-straight-routing';
import { groupChildrenChangeExtent } from './middlewares/group-children-change-extent';
import { groupChildrenMoveExtent } from './middlewares/group-children-move-extent';
import { nodePositionSnapMiddleware } from './middlewares/node-position-snap';
import { nodeRotationSnapMiddleware } from './middlewares/node-rotation-snap';

export const defaultMiddlewares = [
  nodeRotationSnapMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  edgesStraightRoutingMiddleware,
  nodePositionSnapMiddleware,
] as const satisfies Middleware[];
