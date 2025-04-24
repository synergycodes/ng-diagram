import { Middleware } from '../types';
import { selectionChangeMiddleware } from './selection-change';

export const middlewares: Middleware[] = [selectionChangeMiddleware];
