import type { Middleware } from '@angularflow/angular-adapter';
import {
  edgesRoutingMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  nodePositionSnapMiddleware,
  nodeRotationSnapMiddleware,
  treeLayoutMiddleware,
  zIndexMiddleware,
} from '@angularflow/angular-adapter';
import { loggerMiddleware } from '@angularflow/logger-middleware';

export const appMiddlewares = [
  zIndexMiddleware,
  nodeRotationSnapMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  treeLayoutMiddleware,
  nodePositionSnapMiddleware,
  edgesRoutingMiddleware,
  loggerMiddleware,
] as const satisfies Middleware[];

export type AppMiddlewares = typeof appMiddlewares;
