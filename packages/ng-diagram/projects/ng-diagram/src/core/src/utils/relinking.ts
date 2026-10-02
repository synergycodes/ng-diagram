import type { Edge, EdgeEnd } from '../types/edge.interface';

/**
 * Returns whether the user can relink the given end of an edge. It uses the
 * edge's own `relinkable` value when set, otherwise `defaultRelinkable` from
 * the linking config. `true` allows both ends, `'source'` or `'target'` allows
 * only that end, and any other value allows neither.
 *
 * @param edge The edge to check.
 * @param end The endpoint to check.
 * @param defaultRelinkable The `linking.defaultRelinkable` config value.
 * @returns `true` when the user can relink that end.
 * @public
 * @since 1.4.0
 * @category Utilities
 */
export const isEdgeEndRelinkable = (edge: Edge, end: EdgeEnd, defaultRelinkable: boolean | EdgeEnd): boolean => {
  const value = edge.relinkable ?? defaultRelinkable;
  return value === true || value === end;
};
