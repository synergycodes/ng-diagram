import { EdgeRoutingConfig, Point } from '../types';
import { BezierRouting } from './routings/bezier/bezier-routing';
import { OrthogonalRouting } from './routings/orthogonal/orthogonal-routing';
import { PolylineRouting } from './routings/polyline/polyline-routing';
import { EdgeRouting, EdgeRoutingContext, EdgeRoutingName } from './types';

const ROUTING_MUST_HAVE_NAME_WARNING = `[ngDiagram] Routing must have a non-empty name property. Registration skipped.

To fix this:
  • Ensure your EdgeRouting implementation has a 'name' property
  • The name should be a non-empty string

Documentation: https://www.ngdiagram.dev/docs/guides/edges/routing/
`;

const ROUTING_NOT_FOUND_WARNING = (name: string, registeredRoutings: string[], fallback: string) =>
  `[ngDiagram] Routing '${name}' is not registered. Falling back to '${fallback}' routing.

Available routings: ${registeredRoutings.join(', ')}

To fix this:
  • Register the routing using NgDiagramService.registerRouting()
  • Or use one of the available routings listed above

Documentation: https://www.ngdiagram.dev/docs/guides/edges/routing/
`;

const CANNOT_SET_DEFAULT_ROUTING_WARNING = (name: string, registeredRoutings: string[]) =>
  `[ngDiagram] Cannot set default routing to '${name}': routing not registered. Default routing unchanged.

Available routings: ${registeredRoutings.join(', ')}

To fix this:
  • First register the routing using NgDiagramService.registerRouting()
  • Then set it as default

Documentation: https://www.ngdiagram.dev/docs/guides/edges/routing/
`;

/**
 * List of built-in edge routing names in registration order.
 *
 * @remarks
 * These routings are automatically registered when an EdgeRoutingManager is created:
 * - `orthogonal`: Routes edges with right-angle turns
 * - `bezier`: Routes edges with smooth Bezier curves
 * - `polyline`: Routes edges as straight line segments
 *
 * @category Types/Routing
 */
export const BUILT_IN_EDGE_ROUTINGS = ['orthogonal', 'bezier', 'polyline'] as const;

/**
 * **Internal manager** for registration, selection, and execution of edge routing implementations.
 *
 * @remarks
 * **For application code, use {@link NgDiagramService} routing methods instead.**
 * This class is exposed primarily for middleware development where you can access it
 * via `context.edgeRoutingManager`.
 *
 * The manager comes pre-populated with built-in routings (`orthogonal`, `bezier`, `polyline`).
 * You can register custom routings at runtime.
 *
 * @example
 * ```typescript
 * const middleware: Middleware = {
 *   name: 'routing-optimizer',
 *   execute: (context, next) => {
 *     const routingManager = context.edgeRoutingManager;
 *     const defaultRouting = routingManager.getDefaultRouting();
 *     console.log('Using routing:', defaultRouting);
 *     next();
 *   }
 * };
 * ```
 *
 * @public
 * @since 0.8.0
 * @category Internals
 */
export class EdgeRoutingManager {
  private routings = new Map<string, EdgeRouting>();
  private defaultRouting: EdgeRoutingName;
  private getRoutingConfig: () => EdgeRoutingConfig;

  /**
   * Creates a new EdgeRoutingManager and registers built-in routings.
   *
   * @param defaultEdgeRouting - The routing to use when none is specified (defaults to `'orthogonal'`)
   * @param getRoutingConfiguration - Function returning the current routing configuration
   *
   * @internal
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
   * @param routing - The routing instance to register. Its name must be non-empty.
   */
  registerRouting(routing: EdgeRouting): void {
    if (!routing.name) {
      console.warn(ROUTING_MUST_HAVE_NAME_WARNING);
      return;
    }
    this.routings.set(routing.name, routing);
  }

  /**
   * Unregisters a routing by name.
   *
   * @param name - The routing name to remove
   */
  unregisterRouting(name: EdgeRoutingName): void {
    this.routings.delete(name);
  }

  /**
   * Gets a routing implementation by name.
   *
   * @param name - The routing name to look up
   * @returns The routing implementation or `undefined` if not registered
   */
  getRouting(name: EdgeRoutingName): EdgeRouting | undefined {
    return this.routings.get(name);
  }

  /**
   * Gets all registered routing names.
   *
   * @returns An array of registered routing names (built-in and custom)
   */
  getRegisteredRoutings(): EdgeRoutingName[] {
    return Array.from(this.routings.keys());
  }

  /**
   * Checks whether a routing is registered.
   *
   * @param name - The routing name to check
   * @returns `true` if registered; otherwise `false`
   */
  hasRouting(name: EdgeRoutingName): boolean {
    return this.routings.has(name);
  }

  /**
   * Computes the routed points for an edge using the specified routing algorithm.
   *
   * @param routingName - The routing to use. If omitted or undefined, the default routing is used.
   * @param context - The routing context containing source/target nodes, ports, edge data, etc.
   * @returns The computed polyline as an array of points
   *
   * @example
   * ```typescript
   * const points = routingManager.computePoints('orthogonal', {
   *   sourceNode: node1,
   *   targetNode: node2,
   *   sourcePosition: { x: 100, y: 50 },
   *   targetPosition: { x: 300, y: 200 },
   *   edge: edge
   * });
   * ```
   */
  computePoints(routingName: EdgeRoutingName | undefined, context: EdgeRoutingContext): Point[] {
    const name = routingName || this.defaultRouting;
    let routing = this.routings.get(name);

    if (!routing) {
      const fallback = this.defaultRouting;
      console.warn(ROUTING_NOT_FOUND_WARNING(name, this.getRegisteredRoutings(), fallback));
      routing = this.routings.get(fallback);

      if (!routing) {
        return [context.sourcePoint, context.targetPoint].filter((p) => !!p);
      }
    }

    return routing.computePoints(context, this.getRoutingConfig());
  }

  /**
   * Computes an SVG path string for the given points using the specified routing.
   *
   * @param routingName - The routing to use. If omitted or undefined, the default routing is used.
   * @param points - The points to convert into an SVG path string
   * @returns An SVG path string suitable for the `d` attribute of an SVG `<path>` element
   *
   * @example
   * ```typescript
   * const points = [{ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 200, y: 100 }];
   * const path = routingManager.computePath('polyline', points);
   * // Returns: "M 0 0 L 100 100 L 200 100"
   * ```
   */
  computePath(routingName: EdgeRoutingName | undefined, points: Point[]): string {
    const name = routingName || this.defaultRouting;
    let routing = this.routings.get(name);

    if (!routing) {
      const fallback = this.defaultRouting;
      console.warn(ROUTING_NOT_FOUND_WARNING(name, this.getRegisteredRoutings(), fallback));
      routing = this.routings.get(fallback);

      if (!routing) {
        if (points.length === 0) return '';
        return `M ${points[0].x},${points[0].y}`;
      }
    }

    return routing.computeSvgPath(points, this.getRoutingConfig());
  }

  /**
   * Computes a point along the path at a given percentage.
   *
   * @remarks
   * If the selected routing implements `computePointOnPath`, it will be used.
   * Otherwise, falls back to linear interpolation between the first and last points.
   *
   * @param routingName - The routing to use. If omitted or undefined, the default routing is used.
   * @param points - The path points
   * @param percentage - Position along the path in range [0, 1] where 0 = start, 1 = end
   * @returns The interpolated point on the path
   *
   * @example
   * ```typescript
   * const points = [{ x: 0, y: 0 }, { x: 100, y: 100 }];
   * const midpoint = routingManager.computePointOnPath('polyline', points, 0.5);
   * // Returns: { x: 50, y: 50 }
   * const quarterPoint = routingManager.computePointOnPath('polyline', points, 0.25);
   * // Returns: { x: 25, y: 25 }
   * ```
   */
  computePointOnPath(routingName: EdgeRoutingName | undefined, points: Point[], percentage: number): Point {
    const name = routingName || this.defaultRouting;
    let routing = this.routings.get(name);

    if (!routing) {
      const fallback = this.defaultRouting;
      console.warn(ROUTING_NOT_FOUND_WARNING(name, this.getRegisteredRoutings(), fallback));
      routing = this.routings.get(fallback);
    }

    // Use routing's implementation if available
    if (routing?.computePointOnPath) {
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
   * Sets the default routing to use for all edges when no specific routing is specified.
   *
   * @param name - The routing name to set as default
   */
  setDefaultRouting(name: EdgeRoutingName): void {
    if (!this.routings.has(name)) {
      console.warn(CANNOT_SET_DEFAULT_ROUTING_WARNING(name, this.getRegisteredRoutings()));
      return;
    }
    this.defaultRouting = name;
  }

  /**
   * Gets the current default routing name.
   *
   * @returns The name of the current default routing
   */
  getDefaultRouting(): EdgeRoutingName {
    return this.defaultRouting;
  }
}
