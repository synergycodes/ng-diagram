import { Middleware } from '../../../types';

/**
 * Middleware used for logging NgDiagram internal events and state changes
 * @category Types/Middleware
 * @internal
 */
export const loggerMiddleware: Middleware = {
  name: 'logger',
  execute: (context, next) => {
    if (!context.config.debugMode) {
      next();
      return;
    }

    console.log(`[ngDiagram] ${context.modelActionType}`, {
      initialState: context.initialState,
      finalState: context.state,
      history: context.history,
      initialUpdate: context.initialUpdate,
    });

    next();
  },
};
