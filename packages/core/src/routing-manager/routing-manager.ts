import { PortLocation, RoutingConfiguration } from '../types';
import { BezierRouting } from './routings/bezier-routing';
import { OrthogonalRouting } from './routings/orthogonal-routing';
import { StraightRouting } from './routings/straight-routing';
import { Routing, RoutingManagerConfig, RoutingName, RoutingResult } from './types';

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
   * Calculates routing for an edge
   */
  calculateRouting(
    routingName: RoutingName | undefined,
    source: PortLocation,
    target: PortLocation,
    config?: RoutingConfiguration
  ): RoutingResult {
    const name = routingName || this.defaultRouting;
    const routing = this.routings.get(name);

    if (!routing) {
      throw new Error(`Routing '${name}' not found`);
    }

    const points = routing.calculatePoints(source, target, config);
    const svgPath = routing.generateSvgPath(points);

    return {
      points,
      svgPath,
    };
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
