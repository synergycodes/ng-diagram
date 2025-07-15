/*
 * Public API Surface of angular-adapter
 */

export type { Edge, FlowCore, Metadata, Middleware, Node, Point } from '@angularflow/core';
export * from './lib/components/diagram/angular-adapter-diagram.component';
export * from './lib/components/edge-label/angular-adapter-edge-label.component';
export * from './lib/components/edge/custom-edge/custom-edge.component';
export * from './lib/components/port/angular-adapter-port.component';
export * from './lib/directives';
export { CursorPositionTrackerService, FlowCoreProviderService } from './lib/services';
export * from './lib/services/';
export * from './lib/types';
export * from './lib/utils/get-paths/get-bezier-paths';
export * from './lib/utils/get-paths/get-orthogonal-paths';
export * from './lib/utils/get-paths/get-straight-paths';

export {
  edgesRoutingMiddleware,
  groupChildrenChangeExtent,
  groupChildrenMoveExtent,
  nodePositionSnapMiddleware,
  nodeRotationSnapMiddleware,
  treeLayoutMiddleware,
  zIndexMiddleware,
} from '@angularflow/core';
