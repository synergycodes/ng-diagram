import { edgesStraightRoutingMiddleware } from '../middleware-manager/middlewares/edges-straight-routing';
import { groupChildrenChangeExtent } from '../middleware-manager/middlewares/group-children-change-extent';
import { groupChildrenMoveExtent } from '../middleware-manager/middlewares/group-children-move-extent';
import { nodePositionSnapMiddleware } from '../middleware-manager/middlewares/node-position-snap';
import { nodeRotationSnapMiddleware } from '../middleware-manager/middlewares/node-rotation-snap';
import type { Middleware } from './middleware.interface';

// Helper type to extract metadata type from a middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractMiddlewareMetadata<T> = T extends Middleware<any, infer M> ? M : never;

// Helper type to extract the name from a middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractMiddlewareName<T> = T extends Middleware<infer N, any> ? N : never;

// Type to create the metadata map from middleware array
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MiddlewaresMetadataFromMiddlewares<T extends readonly Middleware<any, any>[]> = {
  [K in T[number] as ExtractMiddlewareName<K>]: ExtractMiddlewareMetadata<K>;
};

export type MiddlewareArray = readonly Middleware[];

// Default middlewares type
type DefaultMiddlewares = readonly [
  typeof nodePositionSnapMiddleware,
  typeof nodeRotationSnapMiddleware,
  typeof groupChildrenChangeExtent,
  typeof groupChildrenMoveExtent,
  typeof edgesStraightRoutingMiddleware,
];

export type CombinedMiddlewaresMetadata<TCustom extends MiddlewareArray> =
  MiddlewaresMetadataFromMiddlewares<DefaultMiddlewares> & MiddlewaresMetadataFromMiddlewares<TCustom>;
