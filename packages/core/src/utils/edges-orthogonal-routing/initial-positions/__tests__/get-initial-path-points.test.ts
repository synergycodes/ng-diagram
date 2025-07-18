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

  it('should call top handler', () => {
    getInitialPathPoints({ ...source, side: 'top' }, { ...target, side: 'bottom' }, center);
    expect(getInitialPositionSourceTop).toHaveBeenCalled();
  });

  it('should call right handler', () => {
    getInitialPathPoints({ ...source, side: 'right' }, { ...target, side: 'left' }, center);
    expect(getInitialPositionSourceRight).toHaveBeenCalled();
  });

  it('should call bottom handler', () => {
    getInitialPathPoints({ ...source, side: 'bottom' }, { ...target, side: 'top' }, center);
    expect(getInitialPositionSourceBottom).toHaveBeenCalled();
  });

  it('should call left handler', () => {
    getInitialPathPoints({ ...source, side: 'left' }, { ...target, side: 'right' }, center);
    expect(getInitialPositionSourceLeft).toHaveBeenCalled();
  });

  it('should fallback to left handler for unknown side', () => {
    getInitialPathPoints({ ...source, side: 'unknown' as PortSide }, { ...target, side: 'right' }, center);
    expect(getInitialPositionSourceLeft).toHaveBeenCalled();
  });
});
