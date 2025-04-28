import type { Middleware } from '@angularflow/core';

export const loggerMiddleware: Middleware = {
  name: 'logger',
  execute: (state, context) => {
    console.log(`[AngularFlow] ${context.modelActionType}`, {
      initialState: context.initialState,
      finalState: state,
      historyUpdates: context.historyUpdates,
    });

    return state;
  },
};
