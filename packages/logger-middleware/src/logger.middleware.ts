import type { Middleware } from '@angularflow/core';

export const loggerMiddleware: Middleware = {
  name: 'logger',
  execute: (context, next) => {
    console.log(`[AngularFlow] ${context.modelActionType}`, {
      initialState: context.initialState,
      finalState: context.state,
      history: context.history,
      initialUpdate: context.initialUpdate,
    });

    next();
  },
};
