import { edgesRoutingMiddleware, loggerMiddleware, MiddlewareChain, zIndexMiddleware } from '../../core/src';

export const BUILTIN_MIDDLEWARES = [
  zIndexMiddleware,
  edgesRoutingMiddleware,
  loggerMiddleware,
] as const satisfies MiddlewareChain;

/**
 * `AppMiddlewares` is a tuple type representing the default middleware chain used by ngDiagram.
 *
 * This type is used as the default for the `createMiddlewares` factory and as the base type for customizing
 * or extending the middleware chain in your application.
 *
 * @internal
 */
export type AppMiddlewares = typeof BUILTIN_MIDDLEWARES;

/**
 * Factory method to create a list of middlewares for ng-diagram.
 * Allows modifying the default middleware chain by removing, replacing, or adding new middlewares.
 *
 * @template TMiddlewares - The type of the resulting middleware chain
 * @param middlewares - Function that receives default middlewares and returns modified middleware chain
 * @returns The modified middleware chain
 *
 * Use with extreme caution - incorrectly modifying required middlewares can break the library
 */
export function createMiddlewares<TMiddlewares extends MiddlewareChain = AppMiddlewares>(
  middlewares: (defaults: AppMiddlewares) => TMiddlewares
): TMiddlewares {
  return middlewares(BUILTIN_MIDDLEWARES);
}
