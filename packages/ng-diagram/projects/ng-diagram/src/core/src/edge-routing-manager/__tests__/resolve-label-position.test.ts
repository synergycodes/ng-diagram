import { describe, expect, it, vi } from 'vitest';
import { Point } from '../../types';
import { EdgeRoutingManager } from '../edge-routing-manager';
import { resolveLabelPosition } from '../resolve-label-position';

describe('resolveLabelPosition', () => {
  const points: Point[] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ];
  const routing = 'polyline';

  const mockRoutingManager = {
    computePointOnPath: vi.fn().mockReturnValue({ x: 50, y: 0 }),
    computePointAtDistance: vi.fn().mockReturnValue({ x: 30, y: 0 }),
  } as unknown as EdgeRoutingManager;

  it('should call computePointOnPath for numeric (relative) position', () => {
    const result = resolveLabelPosition(0.5, routing, points, mockRoutingManager);

    expect(mockRoutingManager.computePointOnPath).toHaveBeenCalledWith(routing, points, 0.5);
    expect(result).toEqual({ x: 50, y: 0 });
  });

  it('should call computePointAtDistance for string (absolute) position', () => {
    const result = resolveLabelPosition('30px', routing, points, mockRoutingManager);

    expect(mockRoutingManager.computePointAtDistance).toHaveBeenCalledWith(routing, points, 30);
    expect(result).toEqual({ x: 30, y: 0 });
  });

  it('should parse negative absolute position', () => {
    resolveLabelPosition('-20px', routing, points, mockRoutingManager);

    expect(mockRoutingManager.computePointAtDistance).toHaveBeenCalledWith(routing, points, -20);
  });

  it('should parse zero absolute position', () => {
    resolveLabelPosition('0px', routing, points, mockRoutingManager);

    expect(mockRoutingManager.computePointAtDistance).toHaveBeenCalledWith(routing, points, 0);
  });

  it('should handle relative position 0', () => {
    resolveLabelPosition(0, routing, points, mockRoutingManager);

    expect(mockRoutingManager.computePointOnPath).toHaveBeenCalledWith(routing, points, 0);
  });

  it('should handle relative position 1', () => {
    resolveLabelPosition(1, routing, points, mockRoutingManager);

    expect(mockRoutingManager.computePointOnPath).toHaveBeenCalledWith(routing, points, 1);
  });

  it('should handle undefined routing', () => {
    resolveLabelPosition(0.5, undefined, points, mockRoutingManager);

    expect(mockRoutingManager.computePointOnPath).toHaveBeenCalledWith(undefined, points, 0.5);
  });

  it('should handle undefined routing with absolute position', () => {
    resolveLabelPosition('50px', undefined, points, mockRoutingManager);

    expect(mockRoutingManager.computePointAtDistance).toHaveBeenCalledWith(undefined, points, 50);
  });
});
