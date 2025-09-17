import type { Middleware } from 'ng-diagram';

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

    // Define actions that should be blocked in read-only mode
    const blockedActions = [
      'addNode',
      'addEdge',
      'updateNode',
      'updateEdge',
      'removeNode',
      'removeEdge',
      'moveNodes',
      'finishLinking',
      'paletteDropNode',
      'resizeNode',
      'rotateNode',
      // Add more potential action names
      'moveNode',
      'updateNodePosition',
      'dragNode',
      'startNodeDrag',
      'endNodeDrag',
      'setNodePosition',
    ];

    // Allow specific actions if configured
    const allowedActions = readOnlyConfig.allowedActions || [];
    const isActionBlocked =
      blockedActions.includes(modelActionType) &&
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
