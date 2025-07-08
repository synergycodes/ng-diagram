import type { Middleware } from '@angularflow/angular-adapter';
import {
  edgesRoutingMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  nodePositionSnapMiddleware,
  nodeRotationSnapMiddleware,
} from '@angularflow/angular-adapter';
import { loggerMiddleware } from '@angularflow/logger-middleware';

export const appMiddlewares = [
  nodeRotationSnapMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  edgesRoutingMiddleware,
  nodePositionSnapMiddleware,
  loggerMiddleware,
] as const satisfies Middleware[];

export type AppMiddlewares = typeof appMiddlewares;
