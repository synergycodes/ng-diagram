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
  nodePositionSnapMiddleware,
  edgesRoutingMiddleware,
  loggerMiddleware,
] as const satisfies Middleware[];

export type AppMiddlewares = typeof appMiddlewares;
