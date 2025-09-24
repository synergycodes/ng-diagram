import { ResizeDirection } from '../../../../core/src';

export type LinePosition = Extract<ResizeDirection, 'top' | 'right' | 'bottom' | 'left'>;

export type HandlePosition = Extract<ResizeDirection, 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>;
