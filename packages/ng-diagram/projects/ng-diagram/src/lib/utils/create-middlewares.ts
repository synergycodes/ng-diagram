import {
  edgesRoutingMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  loggerMiddleware,
  MiddlewareChain,
  zIndexMiddleware,
} from '../../core/src';

export const BUILTIN_MIDDLEWARES = [
  zIndexMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  edgesRoutingMiddleware,
  loggerMiddleware,
] as const satisfies MiddlewareChain;

export type AppMiddlewares = typeof BUILTIN_MIDDLEWARES;

export function createMiddlewares<TMiddlewares extends MiddlewareChain = AppMiddlewares>(
  middlewares: (defaults: AppMiddlewares) => TMiddlewares
): TMiddlewares {
  return middlewares(BUILTIN_MIDDLEWARES);
}
