import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Edge, EdgeRoutingConfig, Node, Point, PortLocation } from '../../types';
import { EdgeRoutingManager } from '../edge-routing-manager';
import { EdgeRouting, EdgeRoutingContext, EdgeRoutingName } from '../types';

// Mock routing implementation for testing
class MockRouting implements EdgeRouting {
  constructor(public name: string) {}

  computePoints = vi.fn((context: EdgeRoutingContext): Point[] => {
    return [
      { x: context.sourcePoint.x, y: context.sourcePoint.y },
      { x: context.targetPoint.x, y: context.targetPoint.y },
    ];
  });

  computeSvgPath = vi.fn((points: Point[]): string => {
    if (points.length === 0) return '';
    return `M ${points[0].x},${points[0].y} L ${points[points.length - 1].x},${points[points.length - 1].y}`;
  });

  computePointOnPath = vi.fn((points: Point[], percentage: number): Point => {
    if (points.length < 2) return points[0] || { x: 0, y: 0 };
    const start = points[0];
    const end = points[points.length - 1];
    return {
      x: start.x + (end.x - start.x) * percentage,
      y: start.y + (end.y - start.y) * percentage,
    };
  });
}

// Mock routing without computePointOnPath for testing fallback
class MockRoutingWithoutPointOnPath implements EdgeRouting {
  constructor(public name: string) {}

  computePoints = vi.fn((): Point[] => [
    { x: 0, y: 0 },
    { x: 100, y: 100 },
  ]);

  computeSvgPath = vi.fn((): string => 'M 0,0 L 100,100');
}

describe('EdgeRoutingManager', () => {
  let manager: EdgeRoutingManager;
  let mockConfig: EdgeRoutingConfig;
  let getConfig: () => EdgeRoutingConfig;

  beforeEach(() => {
    mockConfig = {
      defaultRouting: 'polyline',
      bezier: { bezierControlOffset: 50 },
      orthogonal: { firstLastSegmentLength: 20, maxCornerRadius: 10 },
    };
    getConfig = vi.fn(() => mockConfig);
    manager = new EdgeRoutingManager('polyline', getConfig);
  });

  // Helper function to create mock edge
  const createMockEdge = (id = 'test', source = 'n1', target = 'n2'): Edge => ({
    id,
    source,
    target,
    data: {},
  });

  // Helper function to create mock node
  const createMockNode = (id: string, x = 0, y = 0): Node => ({
    id,
    position: { x, y },
    size: { width: 100, height: 50 },
    data: {},
  });

  // Helper function to create mock context
  const createMockContext = (sourceX = 0, sourceY = 0, targetX = 100, targetY = 100): EdgeRoutingContext => ({
    sourcePoint: { x: sourceX, y: sourceY, side: 'right' } as PortLocation,
    targetPoint: { x: targetX, y: targetY, side: 'left' } as PortLocation,
    edge: createMockEdge(),
    sourceNode: createMockNode('n1', sourceX, sourceY),
    targetNode: createMockNode('n2', targetX, targetY),
  });

  describe('constructor', () => {
    it('should initialize with default routing and config function', () => {
      expect(manager.getDefaultRouting()).toBe('polyline');
      expect(manager.hasRouting('orthogonal')).toBe(true);
      expect(manager.hasRouting('bezier')).toBe(true);
      expect(manager.hasRouting('polyline')).toBe(true);
    });

    it('should register built-in routings', () => {
      const routings = manager.getRegisteredRoutings();
      expect(routings).toContain('orthogonal');
      expect(routings).toContain('bezier');
      expect(routings).toContain('polyline');
    });

    it('should use provided default routing', () => {
      const customManager = new EdgeRoutingManager('bezier', getConfig);
      expect(customManager.getDefaultRouting()).toBe('bezier');
    });

    it('should handle null/undefined default routing', () => {
      const customManager = new EdgeRoutingManager(null as unknown as EdgeRoutingName, getConfig);
      expect(customManager.getDefaultRouting()).toBe('orthogonal');
    });

    it('should handle null/undefined config function', () => {
      const customManager = new EdgeRoutingManager('polyline', null as unknown as () => EdgeRoutingConfig);
      // Should not throw and provide empty config
      const context = createMockContext();
      expect(() => customManager.computePoints('polyline', context)).not.toThrow();
    });
  });

  describe('registerRouting', () => {
    it('should register a new routing', () => {
      const customRouting = new MockRouting('custom');
      manager.registerRouting(customRouting);

      expect(manager.hasRouting('custom')).toBe(true);
      expect(manager.getRouting('custom')).toBe(customRouting);
    });

    it('should replace existing routing with same name', () => {
      const routing1 = new MockRouting('custom');
      const routing2 = new MockRouting('custom');

      manager.registerRouting(routing1);
      expect(manager.getRouting('custom')).toBe(routing1);

      manager.registerRouting(routing2);
      expect(manager.getRouting('custom')).toBe(routing2);
    });

    it('should throw error if routing has no name', () => {
      const namelessRouting = new MockRouting('');
      expect(() => manager.registerRouting(namelessRouting)).toThrow('Routing must have a name');
    });

    it('should throw error if routing name is null/undefined', () => {
      const nullNameRouting = new MockRouting(null as unknown as string);
      expect(() => manager.registerRouting(nullNameRouting)).toThrow('Routing must have a name');
    });
  });

  describe('unregisterRouting', () => {
    it('should remove registered routing', () => {
      const customRouting = new MockRouting('custom');
      manager.registerRouting(customRouting);
      expect(manager.hasRouting('custom')).toBe(true);

      manager.unregisterRouting('custom');
      expect(manager.hasRouting('custom')).toBe(false);
    });

    it('should not throw when unregistering non-existent routing', () => {
      expect(() => manager.unregisterRouting('non-existent')).not.toThrow();
    });

    it('should allow unregistering built-in routings', () => {
      manager.unregisterRouting('bezier');
      expect(manager.hasRouting('bezier')).toBe(false);
    });
  });

  describe('getRouting', () => {
    it('should return registered routing', () => {
      const routing = manager.getRouting('bezier');
      expect(routing).toBeDefined();
      expect(routing?.name).toBe('bezier');
    });

    it('should return undefined for non-existent routing', () => {
      expect(manager.getRouting('non-existent')).toBeUndefined();
    });
  });

  describe('getRegisteredRoutings', () => {
    it('should return all registered routing names', () => {
      const routings = manager.getRegisteredRoutings();
      expect(routings).toContain('orthogonal');
      expect(routings).toContain('bezier');
      expect(routings).toContain('polyline');
      expect(routings.length).toBe(3);
    });

    it('should include custom routings', () => {
      manager.registerRouting(new MockRouting('custom1'));
      manager.registerRouting(new MockRouting('custom2'));

      const routings = manager.getRegisteredRoutings();
      expect(routings).toContain('custom1');
      expect(routings).toContain('custom2');
      expect(routings.length).toBe(5);
    });
  });

  describe('hasRouting', () => {
    it('should return true for registered routings', () => {
      expect(manager.hasRouting('orthogonal')).toBe(true);
      expect(manager.hasRouting('bezier')).toBe(true);
      expect(manager.hasRouting('polyline')).toBe(true);
    });

    it('should return false for non-existent routings', () => {
      expect(manager.hasRouting('non-existent')).toBe(false);
    });
  });

  describe('computePoints', () => {
    const mockContext: EdgeRoutingContext = createMockContext();

    it('should compute points using specified routing', () => {
      const mockRouting = new MockRouting('mock');
      manager.registerRouting(mockRouting);

      const points = manager.computePoints('mock', mockContext);

      expect(mockRouting.computePoints).toHaveBeenCalledWith(mockContext, mockConfig);
      expect(points).toEqual([
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ]);
    });

    it('should use default routing when none specified', () => {
      const points = manager.computePoints(undefined, mockContext);
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThanOrEqual(2);
    });

    it('should throw error for non-existent routing', () => {
      expect(() => manager.computePoints('non-existent', mockContext)).toThrow("Routing 'non-existent' not found");
    });

    it('should pass configuration to routing', () => {
      const mockRouting = new MockRouting('mock');
      manager.registerRouting(mockRouting);

      manager.computePoints('mock', mockContext);
      expect(mockRouting.computePoints).toHaveBeenCalledWith(mockContext, mockConfig);
    });
  });

  describe('computePath', () => {
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 100 },
    ];

    it('should compute SVG path using specified routing', () => {
      const mockRouting = new MockRouting('mock');
      manager.registerRouting(mockRouting);

      const path = manager.computePath('mock', points);

      expect(mockRouting.computeSvgPath).toHaveBeenCalledWith(points, mockConfig);
      expect(path).toBe('M 0,0 L 100,100');
    });

    it('should use default routing when none specified', () => {
      const path = manager.computePath(undefined, points);
      expect(path).toBeDefined();
      expect(path).toContain('M');
    });

    it('should throw error for non-existent routing', () => {
      expect(() => manager.computePath('non-existent', points)).toThrow("Routing 'non-existent' not found");
    });

    it('should handle empty points array', () => {
      const mockRouting = new MockRouting('mock');
      manager.registerRouting(mockRouting);

      const path = manager.computePath('mock', []);
      expect(path).toBe('');
    });
  });

  describe('computePointOnPath', () => {
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ];

    it('should compute point using routing implementation', () => {
      const mockRouting = new MockRouting('mock');
      manager.registerRouting(mockRouting);

      const point = manager.computePointOnPath('mock', points, 0.5);

      expect(mockRouting.computePointOnPath).toHaveBeenCalledWith(points, 0.5);
      expect(point).toEqual({ x: 50, y: 50 });
    });

    it('should use fallback linear interpolation when routing lacks computePointOnPath', () => {
      const mockRouting = new MockRoutingWithoutPointOnPath('mock');
      manager.registerRouting(mockRouting);

      const point = manager.computePointOnPath('mock', points, 0.5);
      expect(point).toEqual({ x: 50, y: 50 });
    });

    it('should use default routing when none specified', () => {
      const point = manager.computePointOnPath(undefined, points, 0.5);
      expect(point).toBeDefined();
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeGreaterThanOrEqual(0);
    });

    it('should throw error for non-existent routing', () => {
      expect(() => manager.computePointOnPath('non-existent', points, 0.5)).toThrow("Routing 'non-existent' not found");
    });

    it('should handle edge cases in fallback', () => {
      const mockRouting = new MockRoutingWithoutPointOnPath('mock');
      manager.registerRouting(mockRouting);

      // Single point
      expect(manager.computePointOnPath('mock', [{ x: 50, y: 50 }], 0.5)).toEqual({ x: 50, y: 50 });

      // Empty array
      expect(manager.computePointOnPath('mock', [], 0.5)).toEqual({ x: 0, y: 0 });

      // Percentage at 0
      expect(manager.computePointOnPath('mock', points, 0)).toEqual({ x: 0, y: 0 });

      // Percentage at 1
      expect(manager.computePointOnPath('mock', points, 1)).toEqual({ x: 100, y: 100 });
    });
  });

  describe('setDefaultRouting', () => {
    it('should set default routing for registered routing', () => {
      manager.setDefaultRouting('bezier');
      expect(manager.getDefaultRouting()).toBe('bezier');
    });

    it('should throw error for non-existent routing', () => {
      expect(() => manager.setDefaultRouting('non-existent')).toThrow(
        "Cannot set default routing to 'non-existent': routing not registered"
      );
    });

    it('should allow setting custom routing as default', () => {
      const customRouting = new MockRouting('custom');
      manager.registerRouting(customRouting);
      manager.setDefaultRouting('custom');
      expect(manager.getDefaultRouting()).toBe('custom');
    });
  });

  describe('getDefaultRouting', () => {
    it('should return current default routing', () => {
      expect(manager.getDefaultRouting()).toBe('polyline');

      manager.setDefaultRouting('bezier');
      expect(manager.getDefaultRouting()).toBe('bezier');
    });
  });

  describe('integration tests', () => {
    it('should work with all built-in routings', () => {
      const context: EdgeRoutingContext = createMockContext();

      // Test orthogonal
      const orthogonalPoints = manager.computePoints('orthogonal', context);
      expect(orthogonalPoints.length).toBeGreaterThanOrEqual(2);
      const orthogonalPath = manager.computePath('orthogonal', orthogonalPoints);
      expect(orthogonalPath).toContain('M');
      const orthogonalPoint = manager.computePointOnPath('orthogonal', orthogonalPoints, 0.5);
      expect(orthogonalPoint).toBeDefined();

      // Test bezier
      const bezierPoints = manager.computePoints('bezier', context);
      expect(bezierPoints.length).toBeGreaterThanOrEqual(2);
      const bezierPath = manager.computePath('bezier', bezierPoints);
      expect(bezierPath).toContain('M');
      const bezierPoint = manager.computePointOnPath('bezier', bezierPoints, 0.5);
      expect(bezierPoint).toBeDefined();

      // Test polyline
      const polylinePoints = manager.computePoints('polyline', context);
      expect(polylinePoints.length).toBeGreaterThanOrEqual(2);
      const polylinePath = manager.computePath('polyline', polylinePoints);
      expect(polylinePath).toContain('M');
      const polylinePoint = manager.computePointOnPath('polyline', polylinePoints, 0.5);
      expect(polylinePoint).toBeDefined();
    });

    it('should support custom routing workflow', () => {
      // Register custom routing
      const customRouting = new MockRouting('custom');
      manager.registerRouting(customRouting);

      // Set as default
      manager.setDefaultRouting('custom');

      // Use without specifying name
      const context: EdgeRoutingContext = createMockContext(10, 20, 110, 120);

      const points = manager.computePoints(undefined, context);
      expect(customRouting.computePoints).toHaveBeenCalled();
      expect(points).toEqual([
        { x: 10, y: 20 },
        { x: 110, y: 120 },
      ]);
    });

    it('should handle routing replacement', () => {
      const original = manager.getRouting('bezier');
      expect(original).toBeDefined();

      // Replace with custom implementation
      const replacement = new MockRouting('bezier');
      manager.registerRouting(replacement);

      expect(manager.getRouting('bezier')).toBe(replacement);
      expect(manager.getRouting('bezier')).not.toBe(original);
    });
  });
});
