import { describe, expect, it } from 'vitest';
import { Point } from '../../../../types';
import { getRotationAngle } from '../get-rotation-angle.ts';

describe('getRotationAngle', () => {
  const createPoint = (x: number, y: number): Point => ({ x, y });

  describe('basic rotation calculations', () => {
    it('should return approximately 0.057 degrees when handle and mouse are at the same position', () => {
      const center = createPoint(0, 0);
      const handle = createPoint(1, 0);
      const mouse = createPoint(1, 0);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(0.057, 2);
    });

    it('should return 90 degrees for clockwise quarter turn', () => {
      const center = createPoint(0, 0);
      const handle = createPoint(1, 0);
      const mouse = createPoint(0, 1);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(90, 5);
    });

    it('should return -90 degrees for anticlockwise quarter turn', () => {
      const center = createPoint(0, 0);
      const handle = createPoint(1, 0);
      const mouse = createPoint(0, -1);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(-90, 5);
    });

    it('should return 180 degrees for half turn', () => {
      const center = createPoint(0, 0);
      const handle = createPoint(1, 0);
      const mouse = createPoint(-1, 0);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(180, 5);
    });

    it('should return 180 degrees for half turn in opposite direction', () => {
      const center = createPoint(0, 0);
      const handle = createPoint(-1, 0);
      const mouse = createPoint(1, 0);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(180, 5);
    });
  });

  describe('edge cases', () => {
    it('should handle very small distances', () => {
      const center = createPoint(0, 0);
      const handle = createPoint(0.001, 0);
      const mouse = createPoint(0, 0.001);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(90, 0);
    });

    it('should handle when center, handle, and mouse are collinear', () => {
      const center = createPoint(0, 0);
      const handle = createPoint(1, 0);
      const mouse = createPoint(2, 0);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(0, 1);
    });

    it('should handle when all points are the same', () => {
      const center = createPoint(5, 5);
      const handle = createPoint(5, 5);
      const mouse = createPoint(5, 5);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(60, 1);
    });
  });

  describe('different quadrants', () => {
    it('should work with positive coordinates', () => {
      const center = createPoint(5, 5);
      const handle = createPoint(6, 5);
      const mouse = createPoint(5, 6);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(90, 5);
    });

    it('should work with negative coordinates', () => {
      const center = createPoint(-5, -5);
      const handle = createPoint(-4, -5);
      const mouse = createPoint(-5, -4);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(90, 1);
    });

    it('should work with mixed positive and negative coordinates', () => {
      const center = createPoint(0, 0);
      const handle = createPoint(-1, 0);
      const mouse = createPoint(0, 1);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(-90, 5);
    });
  });

  describe('precision and numerical stability', () => {
    it('should handle very large coordinates', () => {
      const center = createPoint(1000000, 1000000);
      const handle = createPoint(1000001, 1000000);
      const mouse = createPoint(1000000, 1000001);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(90, 5);
    });

    it('should handle floating point coordinates', () => {
      const center = createPoint(0.123, 0.456);
      const handle = createPoint(1.123, 0.456);
      const mouse = createPoint(0.123, 1.456);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(90, 5);
    });

    it('should be consistent for multiple calls with same input', () => {
      const center = createPoint(0, 0);
      const handle = createPoint(1, 0);
      const mouse = createPoint(0, 1);

      const angle1 = getRotationAngle({ handle, center, pointer: mouse });
      const angle2 = getRotationAngle({ handle, center, pointer: mouse });
      const angle3 = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle1).toBe(angle2);
      expect(angle2).toBe(angle3);
    });
  });

  describe('specific angle calculations', () => {
    it('should return 45 degrees for diagonal clockwise rotation', () => {
      const center = createPoint(0, 0);
      const handle = createPoint(1, 0);
      const mouse = createPoint(1, 1);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(45, 5);
    });

    it('should return -45 degrees for diagonal anticlockwise rotation', () => {
      const center = createPoint(0, 0);
      const handle = createPoint(1, 0);
      const mouse = createPoint(1, -1);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(-45, 5);
    });

    it('should return 135 degrees for three-quarter clockwise rotation', () => {
      const center = createPoint(0, 0);
      const handle = createPoint(1, 0);
      const mouse = createPoint(-1, 1);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(135, 5);
    });

    it('should return -135 degrees for three-quarter anticlockwise rotation', () => {
      const center = createPoint(0, 0);
      const handle = createPoint(1, 0);
      const mouse = createPoint(-1, -1);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(-135, 5);
    });
  });

  describe('symmetry tests', () => {
    it('should have symmetric results for mirrored positions', () => {
      const center = createPoint(0, 0);
      const handle = createPoint(1, 0);

      const mouseUp = createPoint(0, 1);
      const mouseDown = createPoint(0, -1);

      const angleUp = getRotationAngle({ handle, center, pointer: mouseUp });
      const angleDown = getRotationAngle({ handle, center, pointer: mouseDown });

      expect(angleUp).toBeCloseTo(-angleDown, 5);
    });

    it('should handle rotation around different center points', () => {
      const center1 = createPoint(0, 0);
      const center2 = createPoint(10, 10);

      const handle1 = createPoint(1, 0);
      const mouse1 = createPoint(0, 1);

      const handle2 = createPoint(11, 10);
      const mouse2 = createPoint(10, 11);

      const angle1 = getRotationAngle({ handle: handle1, center: center1, pointer: mouse1 });
      const angle2 = getRotationAngle({ handle: handle2, center: center2, pointer: mouse2 });

      expect(angle1).toBeCloseTo(angle2, 5);
    });
  });

  describe('performance and robustness', () => {
    it('should handle extreme coordinate values', () => {
      const center = createPoint(0, 0);
      const handle = createPoint(Number.MAX_SAFE_INTEGER / 1000, 0);
      const mouse = createPoint(0, Number.MAX_SAFE_INTEGER / 1000);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).toBeCloseTo(90, 1);
    });

    it('should not return NaN for valid inputs', () => {
      const center = createPoint(0, 0);
      const handle = createPoint(1, 0);
      const mouse = createPoint(0, 1);

      const angle = getRotationAngle({ handle, center, pointer: mouse });

      expect(angle).not.toBeNaN();
      expect(Number.isFinite(angle)).toBe(true);
    });

    it.each([
      [createPoint(0, 1)],
      [createPoint(-1, 0)],
      [createPoint(0, -1)],
      [createPoint(1, 1)],
      [createPoint(-1, 1)],
      [createPoint(-1, -1)],
      [createPoint(1, -1)],
    ])('should return angles within expected range for mouse at %o', (mouse) => {
      const center = createPoint(0, 0);
      const handle = createPoint(1, 0);

      const angle = getRotationAngle({ handle, center, pointer: mouse });
      expect(angle).toBeGreaterThanOrEqual(-180);
      expect(angle).toBeLessThanOrEqual(180);
    });
  });
});
