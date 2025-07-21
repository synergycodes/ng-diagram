import { describe, expect, it } from 'vitest';
import { getInitialPositionSourceLeft } from '../get-initial-position-source-left';

describe('getInitialPositionSourceLeft', () => {
  const xyCenter = { x: 50, y: 50 };

  describe('when targetPortSide is "left"', () => {
    it('returns horizontal path when source is to the right of target', () => {
      const xySource = { x: 60, y: 40 };
      const xyTarget = { x: 30, y: 40 };
      const points = getInitialPositionSourceLeft('left', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 10, y: 40 },
        { x: 10, y: 40 },
      ]);
    });

    it('returns vertical path when source is to the left of target', () => {
      const xySource = { x: 20, y: 40 };
      const xyTarget = { x: 60, y: 40 };
      const points = getInitialPositionSourceLeft('left', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 0, y: 40 },
        { x: 0, y: 40 },
      ]);
    });
  });

  describe('when targetPortSide is "top"', () => {
    it('returns three-point path when source is to the right and below target', () => {
      const xySource = { x: 60, y: 80 };
      const xyTarget = { x: 30, y: 40 };
      const points = getInitialPositionSourceLeft('top', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 50, y: 80 },
        { x: 50, y: 20 },
        { x: 30, y: 20 },
      ]);
    });

    it('returns direct path when source is to the right and above target', () => {
      const xySource = { x: 60, y: 20 };
      const xyTarget = { x: 30, y: 40 };
      const points = getInitialPositionSourceLeft('top', xySource, xyTarget, xyCenter);
      expect(points).toEqual([{ x: 30, y: 20 }]);
    });

    it('returns three-point path when source is to the left and below target', () => {
      const xySource = { x: 20, y: 80 };
      const xyTarget = { x: 60, y: 40 };
      const points = getInitialPositionSourceLeft('top', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 0, y: 80 },
        { x: 0, y: 20 },
        { x: 60, y: 20 },
      ]);
    });

    it('returns three-point path when source is to the left and above target', () => {
      const xySource = { x: 20, y: 20 };
      const xyTarget = { x: 60, y: 40 };
      const points = getInitialPositionSourceLeft('top', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 0, y: 20 },
        { x: 0, y: 50 },
        { x: 60, y: 50 },
      ]);
    });
  });

  describe('when targetPortSide is "bottom"', () => {
    it('returns horizontal path when source is to the right and above target (sourcePort.y > targetPort.y)', () => {
      const xySource = { x: 60, y: 80 };
      const xyTarget = { x: 30, y: 40 };
      const points = getInitialPositionSourceLeft('bottom', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 40, y: 80 },
        { x: 30, y: 80 },
      ]);
    });

    it('returns three-point path when source is to the right and above target', () => {
      const xySource = { x: 60, y: 20 };
      const xyTarget = { x: 30, y: 60 };
      const points = getInitialPositionSourceLeft('bottom', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 50, y: 20 },
        { x: 50, y: 80 },
        { x: 30, y: 80 },
      ]);
    });

    it('returns three-point path when source is to the left and above target (sourcePort.y > targetPort.y)', () => {
      const xySource = { x: 20, y: 80 };
      const xyTarget = { x: 60, y: 40 };
      const points = getInitialPositionSourceLeft('bottom', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 0, y: 80 },
        { x: 0, y: 50 },
        { x: 60, y: 50 },
      ]);
    });

    it('returns three-point path when source is to the left and above target', () => {
      const xySource = { x: 20, y: 20 };
      const xyTarget = { x: 60, y: 60 };
      const points = getInitialPositionSourceLeft('bottom', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 0, y: 20 },
        { x: 0, y: 80 },
        { x: 60, y: 80 },
      ]);
    });
  });

  describe('when targetPortSide is "right"', () => {
    it('returns horizontal path when source is far to the right of target', () => {
      const xySource = { x: 80, y: 40 };
      const xyTarget = { x: 20, y: 40 };
      const points = getInitialPositionSourceLeft('right', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 50, y: 40 },
        { x: 50, y: 40 },
      ]);
    });

    it('returns four-point path when source is to the right of target', () => {
      const xySource = { x: 60, y: 40 };
      const xyTarget = { x: 30, y: 40 };
      const points = getInitialPositionSourceLeft('right', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 40, y: 40 },
        { x: 40, y: 50 },
        { x: 50, y: 50 },
        { x: 50, y: 40 },
      ]);
    });

    it('returns four-point path when source is to the left of target', () => {
      const xySource = { x: 20, y: 40 };
      const xyTarget = { x: 60, y: 40 };
      const points = getInitialPositionSourceLeft('right', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 0, y: 40 },
        { x: 0, y: 50 },
        { x: 80, y: 50 },
        { x: 80, y: 40 },
      ]);
    });
  });
});
