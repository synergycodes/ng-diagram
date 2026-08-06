import { ResizeDirection, Side } from '../../../../core/src';

/** All node sides, in render order. Used as the default when `activeSides` is not set. */
export const ALL_SIDES: readonly Side[] = ['top', 'right', 'bottom', 'left'];

export type HandlePosition = Extract<ResizeDirection, 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>;

/** Corner handles, in render order, with the two sides each of them resizes. */
export const HANDLE_SIDES: readonly { position: HandlePosition; sides: readonly [Side, Side] }[] = [
  { position: 'top-left', sides: ['top', 'left'] },
  { position: 'top-right', sides: ['top', 'right'] },
  { position: 'bottom-left', sides: ['bottom', 'left'] },
  { position: 'bottom-right', sides: ['bottom', 'right'] },
];
