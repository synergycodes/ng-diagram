import type { Middleware } from '@angularflow/core';

export interface LoggerMiddlewareMetadata {
  enabled: boolean;
}

export const loggerMiddleware: Middleware<'logger', LoggerMiddlewareMetadata> = {
  name: 'logger',
  defaultMetadata: {
    enabled: true,
  },
  execute: (context, next) => {
    if (!context.middlewareMetadata.enabled) {
      next();
      return;
    }

    console.log(`[AngularFlow] ${context.modelActionType}`, {
      initialState: context.initialState,
      finalState: context.state,
      history: context.history,
      initialUpdate: context.initialUpdate,
    });

    next();
  },
};
