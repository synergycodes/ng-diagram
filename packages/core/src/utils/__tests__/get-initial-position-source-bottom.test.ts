import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getInitialPositionSourceBottom } from '../edges-orthogonal-routing';
import { POINT_DISTANCE } from '../edges-orthogonal-routing';
import * as config from '../edges-orthogonal-routing/constants.ts';

describe('getInitialPositionSourceBottom', () => {
  beforeEach(() => {
    vi.spyOn(config, 'POINT_DISTANCE', 'get').mockReturnValue(20);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns correct positions for targetPortSide "bottom"', () => {
    const targetPortSide = 'bottom';
    const xySource = { x: 10, y: 20 };
    const xyCenter = { x: 20, y: 30 };
    const xyTarget = { x: 30, y: 40 };

    const result = getInitialPositionSourceBottom(targetPortSide, xySource, xyTarget, xyCenter);

    expect(result).toEqual([
      { x: 10, y: 40 + POINT_DISTANCE },
      { x: 30, y: 40 + POINT_DISTANCE },
    ]);
  });

  it('returns correct positions for targetPortSide "left"', () => {
    const targetPortSide = 'left';
    const xySource = { x: 10, y: 20 };
    const xyCenter = { x: 20, y: 30 };
    const xyTarget = { x: 30, y: 40 };

    const result = getInitialPositionSourceBottom(targetPortSide, xySource, xyTarget, xyCenter);

    expect(result).toEqual([{ x: 10, y: 40 }]);
  });

  it('returns correct positions for targetPortSide "top"', () => {
    const targetPortSide = 'top';
    const xySource = { x: 10, y: 20 };
    const xyCenter = { x: 20, y: 30 };
    const xyTarget = { x: 30, y: 40 };

    const result = getInitialPositionSourceBottom(targetPortSide, xySource, xyTarget, xyCenter);

    expect(result).toEqual([
      { x: 10, y: 40 },
      { x: 20, y: 40 },
      { x: 20, y: 20 },
      { x: 30, y: 20 },
    ]);
  });

  it('returns correct positions for targetPortSide "right"', () => {
    const targetPortSide = 'right';
    const xySource = { x: 10, y: 20 };
    const xyCenter = { x: 20, y: 30 };
    const xyTarget = { x: 30, y: 40 };

    const result = getInitialPositionSourceBottom(targetPortSide, xySource, xyTarget, xyCenter);

    expect(result).toEqual([
      { x: 10, y: 30 },
      { x: 50, y: 30 },
      { x: 50, y: 40 },
    ]);
  });
});
