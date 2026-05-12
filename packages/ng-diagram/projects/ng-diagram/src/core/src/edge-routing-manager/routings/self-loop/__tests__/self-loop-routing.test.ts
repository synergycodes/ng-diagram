import { describe, expect, it } from 'vitest';
import { Edge, EdgeRoutingConfig, Node, PortLocation } from '../../../../types';
import { EdgeRoutingContext } from '../../../types';
import { SelfLoopRouting } from '../self-loop-routing';

function createContext(overrides?: Partial<EdgeRoutingContext>): EdgeRoutingContext {
  const sourcePoint: PortLocation = { x: 120, y: 100, side: 'top' };
  const targetPoint: PortLocation = { x: 160, y: 100, side: 'top' };

  return {
    sourcePoint,
    targetPoint,
    edge: { id: 'loop-1', source: 'node-1', target: 'node-1', data: {} } as Edge,
    sourceNode: { id: 'node-1', position: { x: 100, y: 100 }, size: { width: 100, height: 80 }, data: {} } as Node,
    targetNode: { id: 'node-1', position: { x: 100, y: 100 }, size: { width: 100, height: 80 }, data: {} } as Node,
    ...overrides,
  };
}

describe('SelfLoopRouting', () => {
  it('should generate cubic bezier points for a single self-loop', () => {
    const routing = new SelfLoopRouting();
    const points = routing.computePoints(createContext());

    expect(points).toHaveLength(4);
    expect(points[0].y).toBe(100);
    expect(points[3].y).toBe(100);
    expect(points[1].y).toBeLessThan(100);
    expect(points[2].y).toBeLessThan(100);
  });

  it('should use side from port data', () => {
    const routing = new SelfLoopRouting();
    const points = routing.computePoints(
      createContext({
        sourcePoint: { x: 200, y: 120, side: 'right' },
        targetPoint: { x: 200, y: 160, side: 'right' },
        sourcePort: { id: 'source', nodeId: 'node-1', side: 'right', type: 'both' },
        targetPort: { id: 'target', nodeId: 'node-1', side: 'right', type: 'both' },
      })
    );

    expect(points).toHaveLength(4);
    expect(points[0].x).toBe(200);
    expect(points[3].x).toBe(200);
    expect(points[1].x).toBeGreaterThan(200);
    expect(points[2].x).toBeGreaterThan(200);
  });

  it('should fan out multiple self-loops using selfLoopIndex', () => {
    const routing = new SelfLoopRouting();
    const config: EdgeRoutingConfig = {
      defaultRouting: 'orthogonal',
      selfLoop: { loopSize: 40, loopSpread: 24, sizeIncrement: 10, defaultSide: 'top' },
    };

    const firstLoop = routing.computePoints(createContext({ selfLoopIndex: 0, selfLoopCount: 3 }), config);
    const secondLoop = routing.computePoints(createContext({ selfLoopIndex: 1, selfLoopCount: 3 }), config);
    const thirdLoop = routing.computePoints(createContext({ selfLoopIndex: 2, selfLoopCount: 3 }), config);

    expect(firstLoop).not.toEqual(secondLoop);
    expect(secondLoop).not.toEqual(thirdLoop);
  });

  it('should generate a valid svg cubic path', () => {
    const routing = new SelfLoopRouting();
    const points = routing.computePoints(createContext());
    const path = routing.computeSvgPath(points);

    expect(path).toContain('M ');
    expect(path).toContain(' C ');
  });

  it('should compute point on path and at distance', () => {
    const routing = new SelfLoopRouting();
    const points = routing.computePoints(createContext());

    const midpoint = routing.computePointOnPath(points, 0.5);
    const pointAtDistance = routing.computePointAtDistance(points, 20);

    expect(midpoint).toHaveProperty('x');
    expect(midpoint).toHaveProperty('y');
    expect(pointAtDistance).toHaveProperty('x');
    expect(pointAtDistance).toHaveProperty('y');
  });
});
