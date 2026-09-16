import { describe, expect, it } from 'vitest';
import { mockEdge } from '../../test-utils';
import type { Edge } from '../../types';
import {
  alignManualPointsPatch,
  getDanglingEndpoints,
  getNearestDanglingEndpointInRange,
  hasFreeEndpoint,
  isDanglingEdge,
} from '../dangling-edges';

describe('dangling-edges utils', () => {
  const connectedEdge: Edge = { ...mockEdge, id: 'connected', source: 'node-a', target: 'node-b' };
  const sourceDanglingEdge: Edge = {
    ...mockEdge,
    id: 'source-dangling',
    source: '',
    target: 'node-b',
    sourcePosition: { x: 10, y: 20 },
  };
  const targetDanglingEdge: Edge = {
    ...mockEdge,
    id: 'target-dangling',
    source: 'node-a',
    target: '',
    targetPosition: { x: 100, y: 200 },
  };
  const dualDanglingEdge: Edge = {
    ...mockEdge,
    id: 'dual-dangling',
    source: '',
    target: '',
    sourcePosition: { x: 0, y: 0 },
    targetPosition: { x: 50, y: 50 },
  };

  describe('hasFreeEndpoint', () => {
    it('should report no free endpoint on a fully connected edge', () => {
      expect(hasFreeEndpoint(connectedEdge)).toBe(false);
      expect(hasFreeEndpoint(connectedEdge, 'source')).toBe(false);
      expect(hasFreeEndpoint(connectedEdge, 'target')).toBe(false);
    });

    it('should report the free source endpoint', () => {
      expect(hasFreeEndpoint(sourceDanglingEdge)).toBe(true);
      expect(hasFreeEndpoint(sourceDanglingEdge, 'source')).toBe(true);
      expect(hasFreeEndpoint(sourceDanglingEdge, 'target')).toBe(false);
    });

    it('should report the free target endpoint', () => {
      expect(hasFreeEndpoint(targetDanglingEdge)).toBe(true);
      expect(hasFreeEndpoint(targetDanglingEdge, 'source')).toBe(false);
      expect(hasFreeEndpoint(targetDanglingEdge, 'target')).toBe(true);
    });

    it('should report both free endpoints on a dual dangling edge', () => {
      expect(hasFreeEndpoint(dualDanglingEdge)).toBe(true);
      expect(hasFreeEndpoint(dualDanglingEdge, 'source')).toBe(true);
      expect(hasFreeEndpoint(dualDanglingEdge, 'target')).toBe(true);
    });
  });

  describe('isDanglingEdge', () => {
    it('should classify edges by their free endpoints', () => {
      expect(isDanglingEdge(connectedEdge)).toBe(false);
      expect(isDanglingEdge(sourceDanglingEdge)).toBe(true);
      expect(isDanglingEdge(targetDanglingEdge)).toBe(true);
      expect(isDanglingEdge(dualDanglingEdge)).toBe(true);
    });
  });

  describe('getDanglingEndpoints', () => {
    it('should collect the free endpoints of the given edges', () => {
      const endpoints = getDanglingEndpoints([connectedEdge, sourceDanglingEdge, targetDanglingEdge]);

      expect(endpoints).toEqual([
        { edge: sourceDanglingEdge, end: 'source', position: { x: 10, y: 20 } },
        { edge: targetDanglingEdge, end: 'target', position: { x: 100, y: 200 } },
      ]);
    });

    it('should yield two entries for a dual dangling edge', () => {
      const endpoints = getDanglingEndpoints([dualDanglingEdge]);

      expect(endpoints).toEqual([
        { edge: dualDanglingEdge, end: 'source', position: { x: 0, y: 0 } },
        { edge: dualDanglingEdge, end: 'target', position: { x: 50, y: 50 } },
      ]);
    });

    it('should skip temporary edges', () => {
      const temporaryEdge: Edge = { ...targetDanglingEdge, id: 'temp', temporary: true };

      expect(getDanglingEndpoints([temporaryEdge])).toEqual([]);
    });

    it('should skip effectively hidden edges', () => {
      const hidden: Edge = { ...targetDanglingEdge, id: 'hidden', computedHidden: true };

      expect(getDanglingEndpoints([hidden])).toEqual([]);
    });

    it('should skip free endpoints without a stored position', () => {
      const positionless: Edge = { ...mockEdge, id: 'positionless', source: '', target: 'node-b' };

      expect(getDanglingEndpoints([positionless])).toEqual([]);
    });
  });

  describe('getNearestDanglingEndpointInRange', () => {
    it('should pick the nearest free endpoint within range', () => {
      const nearest = getNearestDanglingEndpointInRange([sourceDanglingEdge, targetDanglingEdge], { x: 12, y: 22 }, 10);

      expect(nearest).toEqual({ edge: sourceDanglingEdge, end: 'source', position: { x: 10, y: 20 } });
    });

    it('should pick the nearest of several endpoints in range', () => {
      const nearest = getNearestDanglingEndpointInRange([dualDanglingEdge], { x: 40, y: 40 }, 100);

      expect(nearest).toEqual({ edge: dualDanglingEdge, end: 'target', position: { x: 50, y: 50 } });
    });

    it('should return null when no endpoint is within range', () => {
      const nearest = getNearestDanglingEndpointInRange(
        [sourceDanglingEdge, targetDanglingEdge],
        { x: 500, y: 500 },
        5
      );

      expect(nearest).toBeNull();
    });

    it('should not pick an effectively hidden edge even when it is the nearest', () => {
      const hidden: Edge = { ...sourceDanglingEdge, id: 'hidden', computedHidden: true };

      const nearest = getNearestDanglingEndpointInRange([hidden, targetDanglingEdge], { x: 10, y: 20 }, 1000);

      expect(nearest).toEqual({ edge: targetDanglingEdge, end: 'target', position: { x: 100, y: 200 } });
    });

    it('should return null for connected edges only', () => {
      expect(getNearestDanglingEndpointInRange([connectedEdge], { x: 0, y: 0 }, 1000)).toBeNull();
    });
  });

  describe('alignManualPointsPatch', () => {
    const manualEdge: Edge = {
      ...mockEdge,
      id: 'manual',
      routingMode: 'manual',
      points: [
        { x: 10, y: 20 },
        { x: 50, y: 60 },
        { x: 110, y: 120 },
      ],
    };
    const anchor = { x: 300, y: 400 };

    it('should return an empty patch for a non-manual edge', () => {
      expect(alignManualPointsPatch({ ...manualEdge, routingMode: undefined }, 'target', anchor)).toEqual({});
      expect(alignManualPointsPatch({ ...manualEdge, routingMode: 'auto' }, 'target', anchor)).toEqual({});
    });

    it('should return an empty patch for a manual edge without points', () => {
      expect(alignManualPointsPatch({ ...manualEdge, points: undefined }, 'target', anchor)).toEqual({});
      expect(alignManualPointsPatch({ ...manualEdge, points: [] }, 'target', anchor)).toEqual({});
    });

    it('should move the last point to the anchor for the target end', () => {
      const patch = alignManualPointsPatch(manualEdge, 'target', anchor);

      expect(patch).toEqual({
        points: [
          { x: 10, y: 20 },
          { x: 50, y: 60 },
          { x: 300, y: 400 },
        ],
      });
      // The stored edge is not mutated — the patch owns fresh point objects.
      expect(manualEdge.points![2]).toEqual({ x: 110, y: 120 });
    });

    it('should move the first point to the anchor for the source end', () => {
      const patch = alignManualPointsPatch(manualEdge, 'source', anchor);

      expect(patch).toEqual({
        points: [
          { x: 300, y: 400 },
          { x: 50, y: 60 },
          { x: 110, y: 120 },
        ],
      });
      expect(manualEdge.points![0]).toEqual({ x: 10, y: 20 });
    });

    it('should move the only point of a single-point edge for either end', () => {
      const singlePointEdge: Edge = { ...manualEdge, points: [{ x: 1, y: 2 }] };

      expect(alignManualPointsPatch(singlePointEdge, 'source', anchor)).toEqual({ points: [{ x: 300, y: 400 }] });
      expect(alignManualPointsPatch(singlePointEdge, 'target', anchor)).toEqual({ points: [{ x: 300, y: 400 }] });
    });
  });
});
