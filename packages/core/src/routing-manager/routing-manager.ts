import { Point, PortLocation, RoutingConfiguration } from '../types';
import { BezierRouting } from './routings/bezier/bezier-routing';
import { OrthogonalRouting } from './routings/orthogonal/orthogonal-routing';
import { StraightRouting } from './routings/straight/straight-routing';
import { Routing, RoutingManagerConfig, RoutingName } from './types';

/**
 * Built-in routing names
 */
export const BUILT_IN_ROUTINGS = ['orthogonal', 'bezier', 'straight'] as const;

/**
 * Manages routing implementations for edges
 */
export class RoutingManager {
  private routings = new Map<string, Routing>();
  private defaultRouting: RoutingName;

  constructor(config: RoutingManagerConfig = {}) {
    this.defaultRouting = config.defaultRouting || 'orthogonal';

    // Register built-in routings
    this.registerRouting(new OrthogonalRouting());
    this.registerRouting(new BezierRouting());
    this.registerRouting(new StraightRouting());
  }

  /**
   * Registers a custom routing
   */
  registerRouting(routing: Routing): void {
    if (!routing.name) {
      throw new Error('Routing must have a name');
    }
    this.routings.set(routing.name, routing);
  }

  /**
   * Unregisters a routing
   */
  unregisterRouting(name: RoutingName): void {
    this.routings.delete(name);
  }

  /**
   * Gets a routing by name
   */
  getRouting(name: RoutingName): Routing | undefined {
    return this.routings.get(name);
  }

  /**
   * Gets all registered routing names
   */
  getRegisteredRoutings(): RoutingName[] {
    return Array.from(this.routings.keys());
  }

  /**
   * Checks if a routing is registered
   */
  hasRouting(name: RoutingName): boolean {
    return this.routings.has(name);
  }

  /**
   * Computes the points for a given routing
   */
  computePoints(
    routingName: RoutingName | undefined,
    source: PortLocation,
    target: PortLocation,
    config?: RoutingConfiguration
  ): Point[] {
    const name = routingName || this.defaultRouting;
    const routing = this.routings.get(name);

    if (!routing) {
      throw new Error(`Routing '${name}' not found`);
    }

    return routing.calculatePoints(source, target, config);
  }

  /**
   * Computes the SVG path for given points and routing
   */
  computePath(routingName: RoutingName | undefined, points: Point[]): string {
    const name = routingName || this.defaultRouting;
    const routing = this.routings.get(name);

    if (!routing) {
      throw new Error(`Routing '${name}' not found`);
    }

    return routing.generateSvgPath(points);
  }

  /**
   * Computes a point on the path at a given percentage
   * Uses the routing's getPointOnPath method if available
   * Falls back to linear interpolation if not implemented
   */
  computePointOnPath(routingName: RoutingName | undefined, points: Point[], percentage: number): Point {
    const name = routingName || this.defaultRouting;
    const routing = this.routings.get(name);

    if (!routing) {
      throw new Error(`Routing '${name}' not found`);
    }

    // Use routing's implementation if available
    if (routing.getPointOnPath) {
      return routing.getPointOnPath(points, percentage);
    }

    // Fallback to simple linear interpolation between first and last points
    if (points.length < 2) return points[0] || { x: 0, y: 0 };

    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const x = startPoint.x + (endPoint.x - startPoint.x) * percentage;
    const y = startPoint.y + (endPoint.y - startPoint.y) * percentage;

    return { x, y };
  }

  /**
   * Sets the default routing
   */
  setDefaultRouting(name: RoutingName): void {
    if (!this.routings.has(name)) {
      throw new Error(`Cannot set default routing to '${name}': routing not registered`);
    }
    this.defaultRouting = name;
  }

  /**
   * Gets the default routing name
   */
  getDefaultRouting(): RoutingName {
    return this.defaultRouting;
  }
}
