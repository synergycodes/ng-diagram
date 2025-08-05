import {
  edgesRoutingMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  MiddlewareChain,
  // nodePositionSnapMiddleware,
  treeLayoutMiddleware,
  zIndexMiddleware,
} from '@angularflow/core';

export const BUILTIN_MIDDLEWARES = [
  zIndexMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  treeLayoutMiddleware,
  // nodePositionSnapMiddleware,
  edgesRoutingMiddleware,
] as const satisfies MiddlewareChain;

export type AppMiddlewares = typeof BUILTIN_MIDDLEWARES;

export function createMiddlewares<TMiddlewares extends MiddlewareChain = AppMiddlewares>(
  middlewares: (defaults: AppMiddlewares) => TMiddlewares
): TMiddlewares {
  return middlewares(BUILTIN_MIDDLEWARES);
}
