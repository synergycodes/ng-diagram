import { Edge, EdgeRoutingConfig, LooseAutocomplete, Node, Point, Port, PortLocation } from '../types';
import { BUILT_IN_EDGE_ROUTINGS } from './edge-routing-manager';

/**
 * Type representing built-in edge routing names
 * @internal
 */
export type BuiltInEdgeRoutingName = (typeof BUILT_IN_EDGE_ROUTINGS)[number];

/**
 * Type representing edge routing name - can be built-in or custom
 *
 * **Allowed values:** `'orthogonal' | 'bezier' | 'polyline'`
 * @category Types
 */
export type EdgeRoutingName = LooseAutocomplete<BuiltInEdgeRoutingName>;

/**
 * Context object containing all information needed for routing computation
 *
 * @category Types
 */
export interface EdgeRoutingContext {
  /**
   * Source port location
   */
  sourcePoint: PortLocation;

  /**
   * Target port location
   */
  targetPoint: PortLocation;

  /**
   * The edge being routed
   */
  edge: Edge;

  /**
   * Source node
   */
  sourceNode?: Node;

  /**
   * Target node
   */
  targetNode?: Node;

  /**
   * Source port (if edge is connected to a specific port)
   */
  sourcePort?: Port;

  /**
   * Target port (if edge is connected to a specific port)
   */
  targetPort?: Port;
}

/**
 * Interface for routing implementations
 */
export interface EdgeRouting {
  /**
   * Name identifier for the routing.
   */
  name: string;

  /**
   * Computes the points for the edge path.
   * This is the core routing logic that determines
   * how an edge is drawn between source and target.
   *
   * @param context - The routing context containing source/target info and layout state.
   * @param [config] - Optional configuration parameters for routing behavior.
   * @returns An array of points representing the routed edge path.
   */
  computePoints(context: EdgeRoutingContext, config?: EdgeRoutingConfig): Point[];

  /**
   * Generates an SVG path string from points.
   * Converts the routed points into a valid `d` attribute
   * for an `<path>` SVG element.
   *
   * @param points - The points defining the edge path.
   * @param [config] - Optional configuration parameters for path generation.
   * @returns An SVG path string.
   */
  computeSvgPath(points: Point[], config?: EdgeRoutingConfig): string;

  /**
   * Gets a point on the path at a given percentage (0-1).
   * Useful for positioning labels, decorations, or interaction handles.
   *
   * @param points - The points defining the path.
   * @param percentage - Position along the path (0 = start, 1 = end).
   * @returns The point at the given percentage along the path.
   */
  computePointOnPath?(points: Point[], percentage: number): Point;
}
