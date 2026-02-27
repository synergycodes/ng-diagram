import type { Edge, Node } from '../../core/src';

/**
 * Strips runtime-computed properties from a node.
 *
 * These properties are recomputed during initialization and stale values
 * from persistence cause the measurement system to skip fresh DOM measurement.
 *
 * @internal
 */
export function stripNodeRuntimeProperties(node: Node): Node {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { selected, measuredPorts, measuredBounds, computedZIndex, _internalId, ...rest } = node as Node & {
    _internalId?: unknown;
  };
  return rest;
}

/**
 * Strips runtime-computed properties from an edge.
 *
 * These properties are recomputed during initialization and stale values
 * from persistence cause the measurement system to skip fresh DOM measurement.
 *
 * @internal
 */
export function stripEdgeRuntimeProperties(edge: Edge): Edge {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sourcePosition, targetPosition, measuredLabels, computedZIndex, _internalId, ...rest } = edge as Edge & {
    _internalId?: unknown;
  };
  return rest;
}
