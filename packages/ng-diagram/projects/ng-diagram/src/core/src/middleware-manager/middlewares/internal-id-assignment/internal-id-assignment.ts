import { FlowStateUpdate, Middleware, Node } from '../../../types';

/**
 * Assigns a unique _internalId to a node or edge.
 *
 * The _internalId is used by Angular's trackBy function to force view recreation when nodes
 * or edges with the same id are deleted and re-added.
 *
 * @param node The node or edge to assign an internal ID to
 * @param generateId Function that generates a unique ID
 * @returns Node or edge with _internalId assigned
 */
export function assignInternalId<T extends Pick<Node, 'id'>>(
  node: T,
  generateId: () => string
): T & { _internalId: string } {
  return {
    ...node,
    _internalId: `${node.id}-${generateId()}`,
  };
}

/**
 * Middleware that automatically generates _internalId for nodes and edges when they are added to the diagram.
 *
 * The _internalId is used by Angular's trackBy function to force view recreation when nodes
 * or edges with the same id are deleted and re-added. This ensures that ng-diagram-port and
 * edge label components properly reinitialize and get measured correctly.
 *
 * Emits `nodesToUpdate`/`edgesToUpdate` PATCHES carrying only `_internalId`
 * (never a re-emit of the initial update): re-adding the whole element objects
 * from `initialUpdate` would silently revert any property another middleware
 * stamped on the added elements earlier in the pass.
 * @internal
 */
export const internalIdMiddleware: Middleware = {
  name: 'internal-id-assignment',
  execute: async (context, next) => {
    const { helpers, environment } = context;

    if (!helpers.anyNodesAdded() && !helpers.anyEdgesAdded()) {
      next();
      return;
    }

    const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = helpers
      .getAddedNodes()
      .map((node) => assignInternalId({ id: node.id }, () => environment.generateId()));
    const edgesToUpdate: FlowStateUpdate['edgesToUpdate'] = helpers
      .getAddedEdges()
      .map((edge) => assignInternalId({ id: edge.id }, () => environment.generateId()));

    next({
      ...(nodesToUpdate.length ? { nodesToUpdate } : {}),
      ...(edgesToUpdate.length ? { edgesToUpdate } : {}),
    });
  },
};
