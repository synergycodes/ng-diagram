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

const appMiddlewares = [
  zIndexMiddleware,
  nodeRotationSnapMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  treeLayoutMiddleware,
  nodePositionSnapMiddleware,
  edgesRoutingMiddleware,
] as const satisfies Middleware[];

if (import.meta.env['NODE_ENV'] === 'development') {
  appMiddlewares.push(loggerMiddleware);
}

export { appMiddlewares };

export type AppMiddlewares = typeof appMiddlewares;
