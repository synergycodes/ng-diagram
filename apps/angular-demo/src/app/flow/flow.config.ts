import { Middleware } from '@angularflow/angular-adapter';
import { loggerMiddleware } from '@angularflow/logger-middleware';

export const appMiddlewares = [loggerMiddleware] as const satisfies Middleware[];
export type AppMiddlewares = typeof appMiddlewares;
