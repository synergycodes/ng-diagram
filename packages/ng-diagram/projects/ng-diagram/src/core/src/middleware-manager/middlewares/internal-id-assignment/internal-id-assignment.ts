import { FlowStateUpdate, Middleware, Node } from '../../../types';

/**
 * Assigns a unique _internalId to a node.
 *
 * The _internalId is used by Angular's trackBy function to force view recreation when nodes
 * with the same id are deleted and re-added.
 *
 * @param node The node to assign an internal ID to
 * @param generateId Function that generates a unique ID
 * @returns Node with _internalId assigned
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
 * Middleware that automatically generates _internalId for nodes when they are added to the diagram.
 *
 * The _internalId is used by Angular's trackBy function to force view recreation when nodes
 * with the same id are deleted and re-added. This ensures that ng-diagram-port components
 * properly reinitialize and ports get measured correctly, enabling proper link creation.
 * @internal
 */
export const internalIdMiddleware: Middleware = {
  name: 'internal-id-assignment',
  execute: async (context, next) => {
    const { helpers, initialUpdate, environment } = context;

    if (!helpers.anyNodesAdded()) {
      next();
      return;
    }

    const nodesToAdd = initialUpdate.nodesToAdd?.map((node) => assignInternalId(node, () => environment.generateId()));

    const stateUpdate: FlowStateUpdate = {
      ...initialUpdate,
      ...(nodesToAdd ? { nodesToAdd } : {}),
    };

    next(stateUpdate);
  },
};
