import { Middleware } from '../../../types';

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

    /*
     * Set window.trace to true to enable console.trace for specific debugging.
     * This is useful for debugging specific actions without cluttering the console.
     * Just set window.trace = true in the console to enable it.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any)['trace']) {
      console.trace(`[AngularFlow] ${context.modelActionType}`);
    }

    next();
  },
};
