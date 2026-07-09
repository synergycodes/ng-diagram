import type { Edge, Node } from '../../core/src';

/**
 * A function that removes runtime-computed properties from a node before
 * initialization or serialization.
 *
 * @public
 * @since 1.2.5
 * @category Types/Model
 */
export type StripNodeRuntimePropertiesFn = (node: Node) => Node;

/**
 * A function that removes runtime-computed properties from an edge before
 * initialization or serialization.
 *
 * @public
 * @since 1.2.5
 * @category Types/Model
 */
export type StripEdgeRuntimePropertiesFn = (edge: Edge) => Edge;

/**
 * Strips runtime-computed properties from a node
 * (`selected`, `measuredPorts`, `measuredBounds`, `computedZIndex`, `_internalId`).
 *
 * These properties are recomputed during initialization and stale values
 * from persistence cause the measurement system to skip fresh DOM measurement.
 *
 * This is the default node strip function used by {@link initializeModel} and
 * {@link initializeModelAdapter}. When providing a custom strip function, wrap
 * this one instead of reimplementing it so future runtime properties stay covered.
 *
 * @public
 * @since 1.2.5
 * @category Utilities
 */
export function stripNodeRuntimeProperties(node: Node): Node {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { selected, measuredPorts, measuredBounds, computedZIndex, _internalId, ...rest } = node as Node & {
    _internalId?: unknown;
  };
  return rest;
}

/**
 * Strips runtime-computed properties from an edge
 * (`sourcePosition`, `targetPosition`, `measuredLabels`, `computedZIndex`, `_internalId`).
 *
 * These properties are recomputed during initialization and stale values
 * from persistence cause the measurement system to skip fresh DOM measurement.
 *
 * This is the default edge strip function used by {@link initializeModel} and
 * {@link initializeModelAdapter}. When providing a custom strip function, wrap
 * this one instead of reimplementing it so future runtime properties stay covered.
 *
 * @public
 * @since 1.2.5
 * @category Utilities
 */
export function stripEdgeRuntimeProperties(edge: Edge): Edge {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sourcePosition, targetPosition, measuredLabels, computedZIndex, _internalId, ...rest } = edge as Edge & {
    _internalId?: unknown;
  };
  return rest;
}
