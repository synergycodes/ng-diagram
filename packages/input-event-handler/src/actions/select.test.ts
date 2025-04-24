import { describe, expect, it } from 'vitest';
import { selectAction } from './select';

describe('selectAction', () => {
  describe('predicate', () => {
    it('should return true for pointerdown events', () => {
      const event = { type: 'pointerdown' };
      expect(selectAction.predicate(event)).toBe(true);
    });
  });
});
