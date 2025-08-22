import { describe, expect, it } from 'vitest';
import { getPathPointsFromRight } from '../utils/pathpoints/get-pathpoints-from-right';

describe('getPathPointsFromRight', () => {
  const xyCenter = { x: 50, y: 50 };

  describe('when targetPortSide is "right"', () => {
    it('returns vertical path when source is to the right of target', () => {
      const xySource = { x: 60, y: 40 };
      const xyTarget = { x: 30, y: 50 };
      const points = getPathPointsFromRight('right', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 80, y: 40 },
        { x: 80, y: 50 },
      ]);
    });

    it('returns horizontal path when source is to the left of target', () => {
      const xySource = { x: 20, y: 40 };
      const xyTarget = { x: 60, y: 40 };
      const points = getPathPointsFromRight('right', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 80, y: 40 },
        { x: 80, y: 40 },
      ]);
    });
  });

  describe('when targetPortSide is "top"', () => {
    it('returns direct path when source is to the left and above target', () => {
      const xySource = { x: 20, y: 10 };
      const xyTarget = { x: 60, y: 40 };
      const points = getPathPointsFromRight('top', xySource, xyTarget, xyCenter);
      expect(points).toEqual([{ x: 60, y: 10 }]);
    });

    it('returns three-point path when source is to the left and at same level as target', () => {
      const xySource = { x: 20, y: 20 };
      const xyTarget = { x: 60, y: 40 };
      const points = getPathPointsFromRight('top', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 50, y: 20 },
        { x: 50, y: 20 },
        { x: 60, y: 20 },
      ]);
    });

    it('returns three-point path when source is to the left and below target', () => {
      const xySource = { x: 20, y: 80 };
      const xyTarget = { x: 60, y: 40 };
      const points = getPathPointsFromRight('top', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 50, y: 80 },
        { x: 50, y: 20 },
        { x: 60, y: 20 },
      ]);
    });

    it('returns three-point path when source is to the right and above target (sourcePort.y < targetPort.y)', () => {
      const xySource = { x: 80, y: 10 };
      const xyTarget = { x: 60, y: 40 };
      const points = getPathPointsFromRight('top', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 100, y: 10 },
        { x: 100, y: 50 },
        { x: 60, y: 50 },
      ]);
    });

    it('returns three-point path when source is to the right and below target (sourcePort.y >= targetPort.y)', () => {
      const xySource = { x: 80, y: 20 };
      const xyTarget = { x: 60, y: 40 };
      const points = getPathPointsFromRight('top', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 100, y: 20 },
        { x: 100, y: 20 },
        { x: 60, y: 20 },
      ]);
    });

    it('returns three-point path when source is to the right and below target', () => {
      const xySource = { x: 80, y: 80 };
      const xyTarget = { x: 60, y: 40 };
      const points = getPathPointsFromRight('top', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 100, y: 80 },
        { x: 100, y: 20 },
        { x: 60, y: 20 },
      ]);
    });
  });

  describe('when targetPortSide is "bottom"', () => {
    it('returns three-point path when source is to the left and above target', () => {
      const xySource = { x: 20, y: 20 };
      const xyTarget = { x: 60, y: 60 };
      const points = getPathPointsFromRight('bottom', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 50, y: 20 },
        { x: 50, y: 80 },
        { x: 60, y: 80 },
      ]);
    });

    it('returns direct path when source is to the left and below target', () => {
      const xySource = { x: 20, y: 80 };
      const xyTarget = { x: 60, y: 60 };
      const points = getPathPointsFromRight('bottom', xySource, xyTarget, xyCenter);
      expect(points).toEqual([{ x: 60, y: 80 }]);
    });

    it('returns three-point path when source is to the right and above target', () => {
      const xySource = { x: 80, y: 20 };
      const xyTarget = { x: 60, y: 60 };
      const points = getPathPointsFromRight('bottom', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 100, y: 20 },
        { x: 100, y: 80 },
        { x: 60, y: 80 },
      ]);
    });

    it('returns three-point path when source is to the right and below target', () => {
      const xySource = { x: 80, y: 80 };
      const xyTarget = { x: 60, y: 60 };
      const points = getPathPointsFromRight('bottom', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 100, y: 80 },
        { x: 100, y: 50 },
        { x: 60, y: 50 },
      ]);
    });
  });

  describe('when targetPortSide is "left"', () => {
    it('returns horizontal path when source is far to the left of target', () => {
      const xySource = { x: 10, y: 40 };
      const xyTarget = { x: 60, y: 40 };
      const points = getPathPointsFromRight('left', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 50, y: 40 },
        { x: 50, y: 40 },
      ]);
    });

    it('returns four-point path when source is to the left of target', () => {
      const xySource = { x: 20, y: 40 };
      const xyTarget = { x: 60, y: 40 };
      const points = getPathPointsFromRight('left', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 40, y: 40 },
        { x: 40, y: 50 },
        { x: 40, y: 50 },
        { x: 40, y: 40 },
      ]);
    });

    it('returns four-point path when source is to the right of target', () => {
      const xySource = { x: 80, y: 40 };
      const xyTarget = { x: 60, y: 40 };
      const points = getPathPointsFromRight('left', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 100, y: 40 },
        { x: 100, y: 50 },
        { x: 40, y: 50 },
        { x: 40, y: 40 },
      ]);
    });
  });
});
