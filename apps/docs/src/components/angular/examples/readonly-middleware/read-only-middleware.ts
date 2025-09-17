import type { Middleware } from 'ng-diagram';

// Define actions that should be blocked in read-only mode
const blockedActions = new Set([
  'changeSelection',
  'moveNodesBy',
  'deleteSelection',
  'addNodes',
  'updateNode',
  'updateNodes',
  'deleteNodes',
  'clearModel',
  'addEdges',
  'updateEdge',
  'deleteEdges',
  'deleteElements',
  'paste',
  'resizeNode',
  'startLinking',
  'moveTemporaryEdge',
  'finishLinking',
  'changeZOrder',
  'rotateNodeTo',
  'highlightGroup',
  'highlightGroupClear',
  'treeLayout',
  'moveNodes',
  'moveNodesStop',
]);

/**
 * Read-only middleware implementation that blocks specific actions when enabled
 */
export const readOnlyMiddleware: Middleware<'read-only'> = {
  name: 'read-only',
  execute: (context, next, cancel) => {
    const { modelActionType, config } = context;

    // Get read-only configuration
    const readOnlyConfig = (config as any).readOnly;

    if (!readOnlyConfig?.enabled) {
      next(); // Not in read-only mode, allow everything
      return;
    }

    // Allow specific actions if configured
    const allowedActions = readOnlyConfig.allowedActions || [];
    const isActionBlocked =
      blockedActions.has(modelActionType) &&
      !allowedActions.includes(modelActionType);

    if (isActionBlocked) {
      console.warn(`🔒 Action "${modelActionType}" blocked by read-only mode`);
      cancel(); // Cancel the operation
      return;
    }

    // Allow the action to proceed
    next();
  },
};
