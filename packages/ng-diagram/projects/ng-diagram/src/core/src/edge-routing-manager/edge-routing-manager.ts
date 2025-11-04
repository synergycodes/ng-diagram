import { EdgeRoutingConfig, Point } from '../types';
import { BezierRouting } from './routings/bezier/bezier-routing';
import { OrthogonalRouting } from './routings/orthogonal/orthogonal-routing';
import { PolylineRouting } from './routings/polyline/polyline-routing';
import { EdgeRouting, EdgeRoutingContext, EdgeRoutingName } from './types';

/**
 * List of built-in edge routing names in registration order.
 */
export const BUILT_IN_EDGE_ROUTINGS = ['orthogonal', 'bezier', 'polyline'] as const;

/**
 * Manages registration, selection, and execution of edge routing implementations.
 *
 * @remarks
 * The manager comes pre-populated with built-in routings (`orthogonal`, `bezier`, `polyline`).
 * You can register custom routings at runtime via {@link EdgeRoutingManager.registerRouting}.
 */
export class EdgeRoutingManager {
  private routings = new Map<string, EdgeRouting>();
  private defaultRouting: EdgeRoutingName;
  private getRoutingConfig: () => EdgeRoutingConfig;

  /**
   * Creates a new {@link EdgeRoutingManager}.
   *
   * @param defaultEdgeRouting - The routing to use when none is specified. Defaults to `'orthogonal'`.
   * @param getRoutingConfiguration - A function returning the current routing configuration object.
   * Defaults to a function that returns an empty object.
   */
  constructor(defaultEdgeRouting: EdgeRoutingName, getRoutingConfiguration: () => EdgeRoutingConfig) {
    this.defaultRouting = defaultEdgeRouting || 'orthogonal';
    this.getRoutingConfig = getRoutingConfiguration || (() => ({}));

    this.registerRouting(new OrthogonalRouting());
    this.registerRouting(new BezierRouting());
    this.registerRouting(new PolylineRouting());
  }

  /**
   * Registers (or replaces) a routing implementation.
   *
   * @param routing - The routing instance to register. Its {@link EdgeRouting.name | name} must be non-empty.
   * @throws Will throw if `routing.name` is falsy.
   */
  registerRouting(routing: EdgeRouting): void {
    if (!routing.name) {
      throw new Error('Routing must have a name');
    }
    this.routings.set(routing.name, routing);
  }

  /**
   * Unregisters a routing by name.
   *
   * @param name - The routing name to remove.
   */
  unregisterRouting(name: EdgeRoutingName): void {
    this.routings.delete(name);
  }

  /**
   * Gets a routing by name.
   *
   * @param name - The routing name to look up.
   * @returns The routing implementation or `undefined` if not registered.
   */
  getRouting(name: EdgeRoutingName): EdgeRouting | undefined {
    return this.routings.get(name);
  }

  /**
   * Gets all registered routing names.
   *
   * @returns An array of registered routing names.
   */
  getRegisteredRoutings(): EdgeRoutingName[] {
    return Array.from(this.routings.keys());
  }

  /**
   * Checks whether a routing is registered.
   *
   * @param name - The routing name to check.
   * @returns `true` if registered; otherwise `false`.
   */
  hasRouting(name: EdgeRoutingName): boolean {
    return this.routings.has(name);
  }

  /**
   * Computes the routed points for an edge using the specified routing.
   *
   * @param [routingName] - The routing to use. If omitted, the default routing is used.
   * @param context - The routing context (source/target nodes, ports, edge etc.).
   * @returns The computed polyline as an array of {@link Point}.
   * @throws Will throw if the resolved routing is not registered.
   */
  computePoints(routingName: EdgeRoutingName | undefined, context: EdgeRoutingContext): Point[] {
    const name = routingName || this.defaultRouting;
    const routing = this.routings.get(name);

    if (!routing) {
      throw new Error(`Routing '${name}' not found`);
    }

    return routing.computePoints(context, this.getRoutingConfig());
  }

  /**
   * Computes an SVG path string for the given points using the specified routing.
   *
   * @param [routingName] - The routing to use. If omitted, the default routing is used.
   * @param points - The points to convert into an SVG `d` path string.
   * @returns An SVG path string suitable for the `d` attribute of an `<path>` element.
   * @throws Will throw if the resolved routing is not registered.
   */
  computePath(routingName: EdgeRoutingName | undefined, points: Point[]): string {
    const name = routingName || this.defaultRouting;
    const routing = this.routings.get(name);

    if (!routing) {
      throw new Error(`Routing '${name}' not found`);
    }

    return routing.computeSvgPath(points, this.getRoutingConfig());
  }

  /**
   * Computes a point along the path at a given percentage.
   *
   * @remarks
   * If the selected routing implements {@link EdgeRouting.computePointOnPath}, it will be used.
   * Otherwise, the method falls back to linear interpolation between the first and last points.
   *
   * @param [routingName] - The routing to use. If omitted, the default routing is used.
   * @param points - The path points.
   * @param percentage - Position along the path in `[0, 1]` (0 = start, 1 = end).
   * @returns The interpolated {@link Point}.
   * @throws Will throw if the resolved routing is not registered.
   *
   * @example
   * ```ts
   * const p50 = manager.computePointOnPath('polyline', points, 0.5); // midpoint
   * ```
   */
  computePointOnPath(routingName: EdgeRoutingName | undefined, points: Point[], percentage: number): Point {
    const name = routingName || this.defaultRouting;
    const routing = this.routings.get(name);

    if (!routing) {
      throw new Error(`Routing '${name}' not found`);
    }

    // Use routing's implementation if available
    if (routing.computePointOnPath) {
      return routing.computePointOnPath(points, percentage);
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
   * Sets the default routing.
   *
   * @param name - The routing name to set as default.
   * @throws Will throw if the routing is not registered.
   */
  setDefaultRouting(name: EdgeRoutingName): void {
    if (!this.routings.has(name)) {
      throw new Error(`Cannot set default routing to '${name}': routing not registered`);
    }
    this.defaultRouting = name;
  }

  /**
   * Gets the default routing name.
   *
   * @returns The current default routing name.
   */
  getDefaultRouting(): EdgeRoutingName {
    return this.defaultRouting;
  }
}
