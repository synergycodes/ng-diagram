import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getInitialPositionSourceTop } from '../edges-orthogonal-routing';
import * as config from '../edges-orthogonal-routing/constants.ts';

describe('getInitialPositionSourceTop', () => {
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

    const result = getInitialPositionSourceTop(targetPortSide, xySource, xyTarget, xyCenter);

    expect(result).toEqual([
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 60 },
      { x: 30, y: 60 },
    ]);
  });

  it('returns correct positions for targetPortSide "left"', () => {
    const targetPortSide = 'left';
    const xySource = { x: 10, y: 20 };
    const xyCenter = { x: 20, y: 30 };
    const xyTarget = { x: 30, y: 40 };

    const result = getInitialPositionSourceTop(targetPortSide, xySource, xyTarget, xyCenter);

    expect(result).toEqual([
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 40 },
    ]);
  });

  it('returns correct positions for targetPortSide "top"', () => {
    const targetPortSide = 'top';
    const xySource = { x: 10, y: 20 };
    const xyCenter = { x: 20, y: 30 };
    const xyTarget = { x: 30, y: 40 };

    const result = getInitialPositionSourceTop(targetPortSide, xySource, xyTarget, xyCenter);

    expect(result).toEqual([
      { x: 10, y: 0 },
      { x: 30, y: 0 },
    ]);
  });

  it('returns correct positions for targetPortSide "right"', () => {
    const targetPortSide = 'right';
    const xySource = { x: 10, y: 20 };
    const xyCenter = { x: 20, y: 30 };
    const xyTarget = { x: 30, y: 40 };

    const result = getInitialPositionSourceTop(targetPortSide, xySource, xyTarget, xyCenter);

    expect(result).toEqual([
      { x: 10, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 40 },
    ]);
  });
});
