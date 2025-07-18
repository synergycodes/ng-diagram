import { describe, expect, it } from 'vitest';
import { getInitialPositionSourceBottom } from '../get-initial-position-source-bottom';

describe('getInitialPositionSourceBottom', () => {
  const xyCenter = { x: 50, y: 50 };

  describe('when targetPortSide is "bottom"', () => {
    it('returns horizontal path when source is below target', () => {
      const xySource = { x: 30, y: 80 };
      const xyTarget = { x: 40, y: 60 };
      const points = getInitialPositionSourceBottom('bottom', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 30, y: 100 },
        { x: 40, y: 100 },
      ]);
    });

    it('returns horizontal path at target level when source is above target', () => {
      const xySource = { x: 30, y: 40 };
      const xyTarget = { x: 40, y: 60 };
      const points = getInitialPositionSourceBottom('bottom', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 30, y: 80 },
        { x: 40, y: 80 },
      ]);
    });
  });

  describe('when targetPortSide is "left"', () => {
    it('returns L-shaped path when source is below and to the right of target', () => {
      const xySource = { x: 60, y: 80 };
      const xyTarget = { x: 40, y: 60 };
      const points = getInitialPositionSourceBottom('left', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 60, y: 100 },
        { x: 20, y: 100 },
        { x: 20, y: 60 },
      ]);
    });

    it('returns center-path when source is below and to the left of target', () => {
      const xySource = { x: 20, y: 80 };
      const xyTarget = { x: 40, y: 60 };
      const points = getInitialPositionSourceBottom('left', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 20, y: 100 },
        { x: 50, y: 100 },
        { x: 50, y: 60 },
      ]);
    });

    it('returns center-vertical path when source is above and to the right of target', () => {
      const xySource = { x: 60, y: 40 };
      const xyTarget = { x: 40, y: 60 };
      const points = getInitialPositionSourceBottom('left', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 60, y: 50 },
        { x: 20, y: 50 },
        { x: 20, y: 60 },
      ]);
    });

    it('returns direct vertical path when source is above and to the left of target', () => {
      const xySource = { x: 20, y: 40 };
      const xyTarget = { x: 40, y: 60 };
      const points = getInitialPositionSourceBottom('left', xySource, xyTarget, xyCenter);
      expect(points).toEqual([{ x: 20, y: 60 }]);
    });
  });

  describe('when targetPortSide is "top"', () => {
    it('returns four-point path when source is below target', () => {
      const xySource = { x: 30, y: 80 };
      const xyTarget = { x: 40, y: 60 };
      const points = getInitialPositionSourceBottom('top', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 30, y: 100 },
        { x: 50, y: 100 },
        { x: 50, y: 40 },
        { x: 40, y: 40 },
      ]);
    });

    it('returns four-point path when source is above target (sourcePort.y > targetPort.y)', () => {
      const xySource = { x: 30, y: 40 };
      const xyTarget = { x: 40, y: 60 };
      const points = getInitialPositionSourceBottom('top', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 30, y: 60 },
        { x: 50, y: 60 },
        { x: 50, y: 40 },
        { x: 40, y: 40 },
      ]);
    });

    it('returns horizontal path when source is below target (sourcePort.y <= targetPort.y)', () => {
      const xySource = { x: 30, y: 20 };
      const xyTarget = { x: 40, y: 60 };
      const points = getInitialPositionSourceBottom('top', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 30, y: 50 },
        { x: 40, y: 50 },
      ]);
    });
  });

  describe('when targetPortSide is "right"', () => {
    it('returns four-point path when source is below and to the right of target', () => {
      const xySource = { x: 80, y: 80 };
      const xyTarget = { x: 30, y: 60 };
      const points = getInitialPositionSourceBottom('right', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 80, y: 100 },
        { x: 50, y: 100 },
        { x: 50, y: 60 },
        { x: 50, y: 60 },
      ]);
    });

    it('returns three-point path when source is below and to the left of target', () => {
      const xySource = { x: 20, y: 80 };
      const xyTarget = { x: 70, y: 60 };
      const points = getInitialPositionSourceBottom('right', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 20, y: 100 },
        { x: 90, y: 100 },
        { x: 90, y: 60 },
      ]);
    });

    it('returns three-point path when source is below and to the left of target (aligned)', () => {
      const xySource = { x: 20, y: 80 };
      const xyTarget = { x: 40, y: 60 };
      const points = getInitialPositionSourceBottom('right', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 20, y: 100 },
        { x: 60, y: 100 },
        { x: 60, y: 60 },
      ]);
    });

    it('returns L-shaped path when source is below and target to the left (creates duplicate point when aligned)', () => {
      const xySource = { x: 60, y: 80 };
      const xyTarget = { x: 40, y: 60 };
      const points = getInitialPositionSourceBottom('right', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 60, y: 100 },
        { x: 60, y: 100 },
        { x: 60, y: 60 },
      ]);
    });

    it('returns direct vertical path when source is above and to the right of target', () => {
      const xySource = { x: 70, y: 40 };
      const xyTarget = { x: 40, y: 60 };
      const points = getInitialPositionSourceBottom('right', xySource, xyTarget, xyCenter);
      expect(points).toEqual([{ x: 70, y: 60 }]);
    });

    it('returns three-point path when source is above and aligned with target', () => {
      const xySource = { x: 60, y: 40 };
      const xyTarget = { x: 40, y: 60 };
      const points = getInitialPositionSourceBottom('right', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 60, y: 50 },
        { x: 60, y: 50 },
        { x: 60, y: 60 },
      ]);
    });

    it('returns three-point path when source is above and to the left of target', () => {
      const xySource = { x: 20, y: 40 };
      const xyTarget = { x: 40, y: 60 };
      const points = getInitialPositionSourceBottom('right', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 20, y: 50 },
        { x: 60, y: 50 },
        { x: 60, y: 60 },
      ]);
    });
  });
});
