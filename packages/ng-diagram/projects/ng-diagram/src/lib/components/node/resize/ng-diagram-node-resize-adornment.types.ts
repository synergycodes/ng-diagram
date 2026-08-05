import { ResizeDirection } from '../../../../core/src';

/**
 * A node edge that can be grabbed to resize the node.
 *
 * Used by the `resizeEdges` input of `NgDiagramNodeResizeAdornmentComponent` to limit
 * which edges start a resize. A corner handle is available only when both of its edges are.
 *
 * @public
 * @since 1.3.0
 * @category Types/Templates
 */
export type ResizeEdge = 'top' | 'right' | 'bottom' | 'left';

/** All resize edges, in render order. Used as the default when `resizeEdges` is not set. */
export const ALL_RESIZE_EDGES: readonly ResizeEdge[] = ['top', 'right', 'bottom', 'left'];

export type HandlePosition = Extract<ResizeDirection, 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>;

/** Corner handles, in render order, with the two edges each of them resizes. */
export const HANDLE_EDGES: readonly { position: HandlePosition; edges: readonly [ResizeEdge, ResizeEdge] }[] = [
  { position: 'top-left', edges: ['top', 'left'] },
  { position: 'top-right', edges: ['top', 'right'] },
  { position: 'bottom-left', edges: ['bottom', 'left'] },
  { position: 'bottom-right', edges: ['bottom', 'right'] },
];
