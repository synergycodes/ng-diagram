import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PortSide } from '../../../../types';

vi.mock('../get-initial-position-source-top.ts', () => ({
  getInitialPositionSourceTop: vi.fn(),
}));
vi.mock('../get-initial-position-source-right.ts', () => ({
  getInitialPositionSourceRight: vi.fn(),
}));
vi.mock('../get-initial-position-source-bottom.ts', () => ({
  getInitialPositionSourceBottom: vi.fn(),
}));
vi.mock('../get-initial-position-source-left.ts', () => ({
  getInitialPositionSourceLeft: vi.fn(),
}));

import { getInitialPathPoints } from '../get-initial-path-points';
import { getInitialPositionSourceBottom } from '../get-initial-position-source-bottom.ts';
import { getInitialPositionSourceLeft } from '../get-initial-position-source-left.ts';
import { getInitialPositionSourceRight } from '../get-initial-position-source-right.ts';
import { getInitialPositionSourceTop } from '../get-initial-position-source-top.ts';

describe('getInitialPathPoints', () => {
  const center = { x: 50, y: 50 };
  const source = { x: 10, y: 20 };
  const target = { x: 100, y: 120 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getInitialPositionSourceTop when source side is "top"', () => {
    getInitialPathPoints({ ...source, side: 'top' }, { ...target, side: 'bottom' }, center);
    expect(getInitialPositionSourceTop).toHaveBeenCalled();
  });

  it('calls getInitialPositionSourceRight when source side is "right"', () => {
    getInitialPathPoints({ ...source, side: 'right' }, { ...target, side: 'left' }, center);
    expect(getInitialPositionSourceRight).toHaveBeenCalled();
  });

  it('calls getInitialPositionSourceBottom when source side is "bottom"', () => {
    getInitialPathPoints({ ...source, side: 'bottom' }, { ...target, side: 'top' }, center);
    expect(getInitialPositionSourceBottom).toHaveBeenCalled();
  });

  it('calls getInitialPositionSourceLeft when source side is "left"', () => {
    getInitialPathPoints({ ...source, side: 'left' }, { ...target, side: 'right' }, center);
    expect(getInitialPositionSourceLeft).toHaveBeenCalled();
  });

  it('falls back to getInitialPositionSourceLeft when source side is unknown', () => {
    getInitialPathPoints({ ...source, side: 'unknown' as PortSide }, { ...target, side: 'right' }, center);
    expect(getInitialPositionSourceLeft).toHaveBeenCalled();
  });
});
