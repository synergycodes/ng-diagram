import type { Middleware } from '@angularflow/angular-adapter';
import {
  zOrderMiddleware,
  edgesRoutingMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  nodePositionSnapMiddleware,
  nodeRotationSnapMiddleware,
  treeLayoutMiddleware,
} from '@angularflow/angular-adapter';
import { loggerMiddleware } from '@angularflow/logger-middleware';

export const appMiddlewares = [
  zOrderMiddleware,
  nodeRotationSnapMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  treeLayoutMiddleware,
  edgesRoutingMiddleware,
  nodePositionSnapMiddleware,
  loggerMiddleware,
] as const satisfies Middleware[];

export type AppMiddlewares = typeof appMiddlewares;
