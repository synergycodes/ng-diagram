import { FlowStateUpdate, Middleware } from '../../../types';

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

    const nodesToAdd = initialUpdate.nodesToAdd?.map((node) => ({
      ...node,
      _internalId: `${node.id}-${environment.generateId()}`,
    }));

    const stateUpdate: FlowStateUpdate = {
      ...initialUpdate,
      ...(nodesToAdd ? { nodesToAdd } : {}),
    };

    next(stateUpdate);
  },
};
