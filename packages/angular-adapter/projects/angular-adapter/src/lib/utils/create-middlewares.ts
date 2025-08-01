import {
  edgesRoutingMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  MiddlewareChain,
  nodePositionSnapMiddleware,
  // nodeRotationSnapMiddleware,
  treeLayoutMiddleware,
  zIndexMiddleware,
} from '@angularflow/core';

export const BUILTIN_MIDDLEWARES = [
  zIndexMiddleware,
  // nodeRotationSnapMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  treeLayoutMiddleware,
  nodePositionSnapMiddleware,
  edgesRoutingMiddleware,
] as const satisfies MiddlewareChain;

export type AppMiddlewares = typeof BUILTIN_MIDDLEWARES;

export function createMiddlewares<TMiddlewares extends MiddlewareChain = AppMiddlewares>(
  middlewares: (defaults: AppMiddlewares) => TMiddlewares
): TMiddlewares {
  return middlewares(BUILTIN_MIDDLEWARES);
}
