import { describe, expect, it } from 'vitest';
import { angleToSide } from './angle-to-side';

describe('angleToSide', () => {
  describe('without inverse', () => {
    it('should return right for angles near 0 degrees', () => {
      expect(angleToSide(0)).toBe('right');
      expect(angleToSide(30)).toBe('right');
      expect(angleToSide(44)).toBe('right');
      expect(angleToSide(315)).toBe('right');
      expect(angleToSide(359)).toBe('right');
    });

    it('should return bottom for angles between 45 and 135 degrees', () => {
      expect(angleToSide(45)).toBe('bottom');
      expect(angleToSide(90)).toBe('bottom');
      expect(angleToSide(134)).toBe('bottom');
    });

    it('should return left for angles between 135 and 225 degrees', () => {
      expect(angleToSide(135)).toBe('left');
      expect(angleToSide(180)).toBe('left');
      expect(angleToSide(224)).toBe('left');
    });

    it('should return top for angles between 225 and 315 degrees', () => {
      expect(angleToSide(225)).toBe('top');
      expect(angleToSide(270)).toBe('top');
      expect(angleToSide(314)).toBe('top');
    });

    it('should normalize angles outside 0-360 range', () => {
      expect(angleToSide(360)).toBe('right'); // 360 -> 0
      expect(angleToSide(450)).toBe('bottom'); // 450 -> 90
      expect(angleToSide(-90)).toBe('top'); // -90 -> 270
      expect(angleToSide(-45)).toBe('right'); // -45 -> 315
      expect(angleToSide(720)).toBe('right'); // 720 -> 0
    });
  });

  describe('with inverse', () => {
    it('should return left (opposite of right) for angles near 0 degrees', () => {
      expect(angleToSide(0, true)).toBe('left');
      expect(angleToSide(30, true)).toBe('left');
      expect(angleToSide(44, true)).toBe('left');
    });

    it('should return top (opposite of bottom) for angles between 45 and 135 degrees', () => {
      expect(angleToSide(45, true)).toBe('top');
      expect(angleToSide(90, true)).toBe('top');
      expect(angleToSide(134, true)).toBe('top');
    });

    it('should return right (opposite of left) for angles between 135 and 225 degrees', () => {
      expect(angleToSide(135, true)).toBe('right');
      expect(angleToSide(180, true)).toBe('right');
      expect(angleToSide(224, true)).toBe('right');
    });

    it('should return bottom (opposite of top) for angles between 225 and 315 degrees', () => {
      expect(angleToSide(225, true)).toBe('bottom');
      expect(angleToSide(270, true)).toBe('bottom');
      expect(angleToSide(314, true)).toBe('bottom');
    });

    it('should handle normalized angles with inverse', () => {
      expect(angleToSide(360, true)).toBe('left'); // 360 -> 0 -> right -> left
      expect(angleToSide(-90, true)).toBe('bottom'); // -90 -> 270 -> top -> bottom
    });
  });

  describe('edge cases at boundaries', () => {
    it('should handle exact boundary angles correctly', () => {
      // Test the exact boundaries between segments
      expect(angleToSide(0)).toBe('right');
      expect(angleToSide(45)).toBe('bottom');
      expect(angleToSide(135)).toBe('left');
      expect(angleToSide(225)).toBe('top');
      expect(angleToSide(315)).toBe('right');
    });

    it('should handle angles just before boundaries', () => {
      expect(angleToSide(44.9)).toBe('right');
      expect(angleToSide(134.9)).toBe('bottom');
      expect(angleToSide(224.9)).toBe('left');
      expect(angleToSide(314.9)).toBe('top');
    });

    it('should handle angles just after boundaries', () => {
      expect(angleToSide(45.1)).toBe('bottom');
      expect(angleToSide(135.1)).toBe('left');
      expect(angleToSide(225.1)).toBe('top');
      expect(angleToSide(315.1)).toBe('right');
    });
  });
});
