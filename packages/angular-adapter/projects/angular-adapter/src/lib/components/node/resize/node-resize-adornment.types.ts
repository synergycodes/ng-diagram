import { ResizeHandlePosition } from '@angularflow/core';

export type LinePosition = Extract<ResizeHandlePosition, 'top' | 'right' | 'bottom' | 'left'>;

export type HandlePosition = Extract<ResizeHandlePosition, 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>;
