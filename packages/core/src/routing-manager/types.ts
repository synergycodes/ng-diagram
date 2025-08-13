import { Point, PortLocation, RoutingConfiguration } from '../types';
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
 * Interface for routing implementations
 */
export interface Routing {
  /**
   * Name identifier for the routing
   */
  name: string;

  /**
   * Calculates the points for the edge path
   */
  calculatePoints(source: PortLocation, target: PortLocation, config?: RoutingConfiguration): Point[];

  /**
   * Generates SVG path string from points
   */
  generateSvgPath(points: Point[]): string;
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
}
