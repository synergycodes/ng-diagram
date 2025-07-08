import type { Middleware } from '@angularflow/angular-adapter';
import {
  edgesRoutingMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  nodePositionSnapMiddleware,
  nodeRotationSnapMiddleware,
  treeLayoutMiddleware,
} from '@angularflow/angular-adapter';
import { loggerMiddleware } from '@angularflow/logger-middleware';

export const appMiddlewares = [
  nodeRotationSnapMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  treeLayoutMiddleware,
  nodePositionSnapMiddleware,
  edgesRoutingMiddleware,
  loggerMiddleware,
] as const satisfies Middleware[];

export type AppMiddlewares = typeof appMiddlewares;
