import type { Edge, EdgeEnd } from '../types/edge.interface';

/**
 * Whether the user can relink the given end of the edge: the edge's own
 * `relinkable` when set, otherwise `defaultRelinkable` from the linking config.
 * `true` allows both ends, an `EdgeEnd` only that end, any other value neither.
 *
 * @public
 * @since 1.4.0
 * @category Utilities
 */
export const isEdgeEndRelinkable = (edge: Edge, end: EdgeEnd, defaultRelinkable: boolean | EdgeEnd): boolean => {
  const value = edge.relinkable ?? defaultRelinkable;
  return value === true || value === end;
};
