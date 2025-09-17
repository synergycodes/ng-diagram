import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PortSide } from '../../../../types/index';

vi.mock('../utils/pathpoints/get-pathpoints-from-top.ts', () => ({
  getPathPointsFromTop: vi.fn(),
}));
vi.mock('../utils/pathpoints/get-pathpoints-from-right.ts', () => ({
  getPathPointsFromRight: vi.fn(),
}));
vi.mock('../utils/pathpoints/get-pathpoints-from-bottom.ts', () => ({
  getPathPointsFromBottom: vi.fn(),
}));
vi.mock('../utils/pathpoints/get-pathpoints-from-left.ts', () => ({
  getPathPointsFromLeft: vi.fn(),
}));

import { getPathPointsFromBottom } from '../utils/pathpoints/get-pathpoints-from-bottom';
import { getPathPointsFromLeft } from '../utils/pathpoints/get-pathpoints-from-left';
import { getPathPointsFromRight } from '../utils/pathpoints/get-pathpoints-from-right';
import { getPathPointsFromTop } from '../utils/pathpoints/get-pathpoints-from-top';
import { getPathPoints } from '../utils/pathpoints/get-pathpoints';

describe('getPathPoints', () => {
  const center = { x: 50, y: 50 };
  const source = { x: 10, y: 20 };
  const target = { x: 100, y: 120 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getPathPointsFromTop when source side is "top"', () => {
    getPathPoints({ ...source, side: 'top' }, { ...target, side: 'bottom' }, center);
    expect(getPathPointsFromTop).toHaveBeenCalled();
  });

  it('calls getPathPointsFromRight when source side is "right"', () => {
    getPathPoints({ ...source, side: 'right' }, { ...target, side: 'left' }, center);
    expect(getPathPointsFromRight).toHaveBeenCalled();
  });

  it('calls getPathPointsFromBottom when source side is "bottom"', () => {
    getPathPoints({ ...source, side: 'bottom' }, { ...target, side: 'top' }, center);
    expect(getPathPointsFromBottom).toHaveBeenCalled();
  });

  it('calls getPathPointsFromLeft when source side is "left"', () => {
    getPathPoints({ ...source, side: 'left' }, { ...target, side: 'right' }, center);
    expect(getPathPointsFromLeft).toHaveBeenCalled();
  });

  it('falls back to getPathPointsFromLeft when source side is unknown', () => {
    getPathPoints({ ...source, side: 'unknown' as PortSide }, { ...target, side: 'right' }, center);
    expect(getPathPointsFromLeft).toHaveBeenCalled();
  });
});
