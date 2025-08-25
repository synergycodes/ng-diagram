import { Edge, Node, Point, Port, PortLocation, RoutingConfiguration } from '../types';
import { BUILT_IN_ROUTINGS } from './routing-manager';

/**
 * Type representing built-in routing names
 */
export type BuiltInRoutingName = (typeof BUILT_IN_ROUTINGS)[number];

/**
 * Type representing routing name - can be built-in or custom string
 */
export type RoutingName = BuiltInRoutingName | (string & {});

/**
 * Context object containing all information needed for routing computation
 */
export interface RoutingContext {
  /**
   * Source port location
   */
  source: PortLocation;

  /**
   * Target port location
   */
  target: PortLocation;

  /**
   * The edge being routed
   */
  edge: Edge;

  /**
   * Source node
   */
  sourceNode: Node;

  /**
   * Target node
   */
  targetNode: Node;

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
export interface Routing {
  /**
   * Name identifier for the routing
   */
  name: string;

  /**
   * Calculates the points for the edge path using full context
   */
  computePoints(context: RoutingContext, config?: RoutingConfiguration): Point[];

  /**
   * Generates SVG path string from points
   */
  computeSvgPath(points: Point[], config?: RoutingConfiguration): string;

  /**
   * Gets a point on the path at a given percentage (0-1)
   * Used for positioning labels on the edge
   * @param points - The points defining the path
   * @param percentage - Position along the path (0 = start, 1 = end)
   * @returns The point at the given percentage along the path
   */
  computePointOnPath?(points: Point[], percentage: number): Point;
}

/**
 * Result of routing calculation
 */
export interface RoutingResult {
  /**
   * Array of points defining the edge path
   */
  points: Point[];

  /**
   * SVG path string for rendering
   */
  svgPath: string;
}

/**
 * Configuration for routing manager
 */
export interface RoutingManagerConfig {
  /**
   * Default routing to use when not specified
   */
  defaultRouting?: RoutingName;
  /**
   * Function to get routing configuration dynamically
   */
  getRoutingConfiguration?: () => RoutingConfiguration;
}
