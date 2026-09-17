import { describe, expect, it } from 'vitest';
import { mockEdge } from '../../test-utils';
import type { Edge, EdgeEnd } from '../../types';
import { isEdgeEndRelinkable } from '../relinking';

describe('isEdgeEndRelinkable', () => {
  const edge: Edge = { ...mockEdge, id: 'edge-1', source: 'node-a', target: 'node-b' };

  describe('resolved values', () => {
    it.each<[boolean | EdgeEnd, boolean, boolean]>([
      [true, true, true],
      ['source', true, false],
      ['target', false, true],
      [false, false, false],
    ])('%j allows source=%s target=%s', (value, source, target) => {
      expect(isEdgeEndRelinkable({ ...edge, relinkable: value }, 'source', false)).toBe(source);
      expect(isEdgeEndRelinkable({ ...edge, relinkable: value }, 'target', false)).toBe(target);
    });

    it('should lock both ends for a value outside the type', () => {
      const locked: Edge = { ...edge, relinkable: 'both' as never };

      expect(isEdgeEndRelinkable(locked, 'source', true)).toBe(false);
      expect(isEdgeEndRelinkable(locked, 'target', true)).toBe(false);
    });
  });

  describe('fallback to the default', () => {
    it('should use the default when the edge has no relinkable property', () => {
      expect(isEdgeEndRelinkable(edge, 'source', true)).toBe(true);
      expect(isEdgeEndRelinkable(edge, 'target', true)).toBe(true);
      expect(isEdgeEndRelinkable(edge, 'source', 'target')).toBe(false);
      expect(isEdgeEndRelinkable(edge, 'target', 'target')).toBe(true);
      expect(isEdgeEndRelinkable(edge, 'source', false)).toBe(false);
      expect(isEdgeEndRelinkable(edge, 'target', false)).toBe(false);
    });

    it('should ignore the default when the edge sets relinkable', () => {
      expect(isEdgeEndRelinkable({ ...edge, relinkable: false }, 'source', true)).toBe(false);
      expect(isEdgeEndRelinkable({ ...edge, relinkable: false }, 'target', true)).toBe(false);
      expect(isEdgeEndRelinkable({ ...edge, relinkable: true }, 'source', false)).toBe(true);
      expect(isEdgeEndRelinkable({ ...edge, relinkable: 'source' }, 'source', 'target')).toBe(true);
      expect(isEdgeEndRelinkable({ ...edge, relinkable: 'source' }, 'target', 'target')).toBe(false);
    });
  });
});
