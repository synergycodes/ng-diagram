import { edgesRoutingMiddleware } from '../middleware-manager/middlewares/edges-routing/edges-routing';
import { groupChildrenChangeExtent } from '../middleware-manager/middlewares/group-children-change-extent';
import { groupChildrenMoveExtent } from '../middleware-manager/middlewares/group-children-move-extent';
import { nodePositionSnapMiddleware } from '../middleware-manager/middlewares/node-position-snap';
import { nodeRotationSnapMiddleware } from '../middleware-manager/middlewares/node-rotation-snap';
import type { Middleware } from './middleware.interface';

// Helper type to extract config type from a middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractMiddlewareConfig<T> = T extends Middleware<any, infer M> ? M : never;

// Helper type to extract the name from a middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractMiddlewareName<T> = T extends Middleware<infer N, any> ? N : never;

// Type to create the config map from middleware array
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MiddlewaresConfigFromMiddlewares<T extends readonly Middleware<any, any>[]> = {
  [K in T[number] as ExtractMiddlewareName<K>]: ExtractMiddlewareConfig<K>;
};

export type MiddlewareArray = readonly Middleware[];

// Default middlewares type
type DefaultMiddlewares = readonly [
  typeof nodePositionSnapMiddleware,
  typeof nodeRotationSnapMiddleware,
  typeof groupChildrenChangeExtent,
  typeof groupChildrenMoveExtent,
  typeof edgesRoutingMiddleware,
];

export type CombinedMiddlewaresConfig<TCustom extends MiddlewareArray> =
  MiddlewaresConfigFromMiddlewares<DefaultMiddlewares> & MiddlewaresConfigFromMiddlewares<TCustom>;
