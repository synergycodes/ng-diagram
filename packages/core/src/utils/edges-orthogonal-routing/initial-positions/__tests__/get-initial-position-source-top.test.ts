import { describe, expect, it } from 'vitest';
import { getInitialPositionSourceTop } from '../get-initial-position-source-top';

describe('getInitialPositionSourceTop', () => {
  const xyCenter = { x: 50, y: 50 };

  describe('when targetPortSide is "left"', () => {
    it('returns normal left path when source is above target', () => {
      const xySource = { x: 30, y: 60 };
      const xyTarget = { x: 40, y: 30 };
      const points = getInitialPositionSourceTop('left', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 30, y: 50 },
        { x: 20, y: 50 },
        { x: 20, y: 30 },
      ]);
    });

    it('returns direct path when source is above target and to the right', () => {
      const xySource = { x: 10, y: 60 };
      const xyTarget = { x: 40, y: 30 };
      const points = getInitialPositionSourceTop('left', xySource, xyTarget, xyCenter);
      expect(points).toEqual([{ x: 10, y: 30 }]);
    });

    it('returns center-vertical path when source is at same level or below target', () => {
      const xySource = { x: 30, y: 40 };
      const xyTarget = { x: 40, y: 60 };
      const points = getInitialPositionSourceTop('left', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 30, y: 20 },
        { x: 20, y: 20 },
        { x: 20, y: 60 },
      ]);
    });
  });

  describe('when targetPortSide is "right"', () => {
    it('returns normal right path when source is above target', () => {
      const xySource = { x: 30, y: 60 };
      const xyTarget = { x: 40, y: 30 };
      const points = getInitialPositionSourceTop('right', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 30, y: 50 },
        { x: 60, y: 50 },
        { x: 60, y: 30 },
      ]);
    });

    it('returns center-horizontal path when source is below target and to the right', () => {
      const xySource = { x: 70, y: 40 };
      const xyTarget = { x: 30, y: 60 };
      const points = getInitialPositionSourceTop('right', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 70, y: 20 },
        { x: 50, y: 20 },
        { x: 50, y: 60 },
      ]);
    });

    it('returns center-vertical path when source is at same level or below target', () => {
      const xySource = { x: 30, y: 40 };
      const xyTarget = { x: 40, y: 60 };
      const points = getInitialPositionSourceTop('right', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 30, y: 20 },
        { x: 60, y: 20 },
        { x: 60, y: 60 },
      ]);
    });
  });

  describe('when targetPortSide is "top"', () => {
    it('returns direct vertical path when source is below target vertically', () => {
      const xySource = { x: 30, y: 80 };
      const xyTarget = { x: 40, y: 30 };
      const points = getInitialPositionSourceTop('top', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 30, y: 10 },
        { x: 40, y: 10 },
      ]);
    });

    it('returns center-horizontal path when source is at same level or above target', () => {
      const xySource = { x: 30, y: 40 };
      const xyTarget = { x: 70, y: 60 };
      const points = getInitialPositionSourceTop('top', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 30, y: 20 },
        { x: 70, y: 20 },
      ]);
    });
  });

  describe('when targetPortSide is "bottom"', () => {
    it('returns normal bottom path when source is above target', () => {
      const xySource = { x: 30, y: 40 };
      const xyTarget = { x: 40, y: 60 };
      const points = getInitialPositionSourceTop('bottom', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 30, y: 20 },
        { x: 50, y: 20 },
        { x: 50, y: 80 },
        { x: 40, y: 80 },
      ]);
    });

    it('returns center-horizontal path when source is at same level or below target', () => {
      const xySource = { x: 30, y: 60 };
      const xyTarget = { x: 70, y: 40 };
      const points = getInitialPositionSourceTop('bottom', xySource, xyTarget, xyCenter);
      expect(points).toEqual([
        { x: 30, y: 40 },
        { x: 50, y: 40 },
        { x: 50, y: 60 },
        { x: 70, y: 60 },
      ]);
    });
  });
});
