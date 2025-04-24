import type { FlowStateDiff, Middleware, MiddlewareContext } from '@angularflow/core';

export const createLoggerMiddleware = (
  options: {
    logState?: boolean;
    logAction?: boolean;
  } = {}
): Middleware => {
  const { logState = true, logAction = true } = options;

  return (stateDiff: FlowStateDiff, context: MiddlewareContext): FlowStateDiff => {
    if (logAction) {
      console.log('[AngularFlow] Action:', {
        type: context.modelAction.name,
        data: context.modelAction.data,
      });
    }

    if (logState) {
      console.log('[AngularFlow] State:', {
        before: context.initialState,
        after: stateDiff,
      });
    }

    return stateDiff;
  };
};
