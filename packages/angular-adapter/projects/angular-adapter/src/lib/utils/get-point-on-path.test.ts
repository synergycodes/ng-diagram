import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPointOnPath } from './get-point-on-path';

describe('getPointOnPath', () => {
  let mockPath: SVGPathElement;
  let mockGetTotalLength: ReturnType<typeof vi.fn>;
  let mockGetPointAtLength: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGetTotalLength = vi.fn();
    mockGetPointAtLength = vi.fn();
    mockPath = {
      getTotalLength: mockGetTotalLength,
      getPointAtLength: mockGetPointAtLength,
    } as unknown as SVGPathElement;
  });

  it('should return the point on the path', () => {
    mockGetTotalLength.mockReturnValue(100);
    mockGetPointAtLength.mockReturnValue({ x: 50, y: 50 });

    const point = getPointOnPath(mockPath, 0.5);

    expect(mockGetTotalLength).toHaveBeenCalled();
    expect(mockGetPointAtLength).toHaveBeenCalledWith(50);
    expect(point).toEqual({ x: 50, y: 50 });
  });
});
