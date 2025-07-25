import { describe, expect, it } from 'vitest';
import { DeepPartial } from '../../types';
import { deepMerge } from '../deep-merge';

describe('deepMerge', () => {
  describe('simple object merging', () => {
    it('should merge simple properties', () => {
      const original = { a: 1, b: 'hello', c: true };
      const override: DeepPartial<typeof original> = { b: 'world' };

      const result = deepMerge(original, override);

      expect(result).toEqual({ a: 1, b: 'world', c: true });
      expect(result).not.toBe(original); // Should create new object
    });

    it('should add new properties from override', () => {
      const original = { a: 1 };
      const override: DeepPartial<typeof original> = { a: 2 };

      const result = deepMerge(original, override);

      expect(result).toEqual({ a: 2 });
    });

    it('should preserve original properties when override is empty', () => {
      const original = { a: 1, b: 'hello', c: true };
      const override: DeepPartial<typeof original> = {};

      const result = deepMerge(original, override);

      expect(result).toEqual(original);
      expect(result).not.toBe(original);
    });
  });

  describe('nested object merging', () => {
    it('should deep merge nested objects', () => {
      const original = {
        level1: {
          a: 1,
          b: 'original',
          level2: {
            x: 'deep',
            y: 100,
          },
        },
        other: 'unchanged',
      };

      const override: DeepPartial<typeof original> = {
        level1: {
          b: 'overridden',
          level2: {
            y: 200,
          },
        },
      };

      const result = deepMerge(original, override);

      expect(result).toEqual({
        level1: {
          a: 1,
          b: 'overridden',
          level2: {
            x: 'deep',
            y: 200,
          },
        },
        other: 'unchanged',
      });
    });

    it('should handle multiple nesting levels', () => {
      const original = {
        a: {
          b: {
            c: {
              d: 'deep',
              e: 42,
            },
          },
        },
      };

      const override: DeepPartial<typeof original> = {
        a: {
          b: {
            c: {
              d: 'updated',
            },
          },
        },
      };

      const result = deepMerge(original, override);

      expect(result.a.b.c.d).toBe('updated');
      expect(result.a.b.c.e).toBe(42);
    });
  });

  describe('function handling', () => {
    it('should preserve functions from original', () => {
      const originalFn = () => 'original';
      const original = {
        fn: originalFn,
        data: { value: 1 },
      };

      const override: DeepPartial<typeof original> = {
        data: { value: 2 },
      };

      const result = deepMerge(original, override);

      expect(result.fn).toBe(originalFn);
      expect(result.data.value).toBe(2);
    });

    it('should override functions when provided in override', () => {
      const originalFn = () => 'original';
      const overrideFn = () => 'override';

      const original = {
        fn: originalFn,
        data: 'test',
      };

      const override: DeepPartial<typeof original> = {
        fn: overrideFn,
      };

      const result = deepMerge(original, override);

      expect(result.fn).toBe(overrideFn);
      expect(result.fn()).toBe('override');
    });

    it('should not deep merge function properties', () => {
      const fn1 = () => 'function1';
      const fn2 = () => 'function2';

      const original = {
        config: {
          handler: fn1,
          data: { nested: true },
        },
      };

      const override: DeepPartial<typeof original> = {
        config: {
          handler: fn2,
        },
      };

      const result = deepMerge(original, override);

      expect(result.config.handler).toBe(fn2);
      expect(result.config.data.nested).toBe(true);
    });
  });

  describe('array handling', () => {
    it('should replace arrays instead of merging them', () => {
      const original = {
        arr: [1, 2, 3],
        data: 'test',
      };

      const override: DeepPartial<typeof original> = {
        arr: [4, 5],
      };

      const result = deepMerge(original, override);

      expect(result.arr).toEqual([4, 5]);
      expect(result.data).toBe('test');
    });

    it('should handle nested arrays', () => {
      const original = {
        config: {
          items: ['a', 'b'],
          value: 1,
        },
      };

      const override: DeepPartial<typeof original> = {
        config: {
          items: ['c', 'd', 'e'],
        },
      };

      const result = deepMerge(original, override);

      expect(result.config.items).toEqual(['c', 'd', 'e']);
      expect(result.config.value).toBe(1);
    });
  });

  describe('null and undefined handling', () => {
    it('should handle null values in override', () => {
      const original = {
        a: 'value',
        b: { nested: true },
      };

      const override: DeepPartial<typeof original> = {
        a: null as unknown as string,
      };

      const result = deepMerge(original, override);

      expect(result.a).toBeNull();
      expect(result.b.nested).toBe(true);
    });

    it('should skip undefined values in override', () => {
      const original = {
        a: 'original',
        b: 'keep',
      };

      const override: DeepPartial<typeof original> = {
        a: undefined,
        b: 'changed',
      };

      const result = deepMerge(original, override);

      expect(result.a).toBe('original'); // Should keep original since override is undefined
      expect(result.b).toBe('changed');
    });

    it('should handle null values in original', () => {
      const original = {
        a: null as unknown as string,
        b: 'value',
      };

      const override: DeepPartial<typeof original> = {
        a: 'override',
      };

      const result = deepMerge(original, override);

      expect(result.a).toBe('override');
      expect(result.b).toBe('value');
    });
  });

  describe('edge cases', () => {
    it('should handle empty objects', () => {
      const original = {};
      const override = {};

      const result = deepMerge(original, override);

      expect(result).toEqual({});
    });
  });

  describe('FlowConfig-like scenarios', () => {
    it('should handle complex configuration objects', () => {
      interface TestEdge {
        id: string;
        type?: string;
        temp?: boolean;
      }

      const computeNodeId = () => `node-id`;
      const computeEdgeId = () => `edge-id`;
      const validateConnection = () => true;
      const temporaryEdgeBuilder = (edge: TestEdge): TestEdge => ({ ...edge, temp: true });

      const original = {
        computeNodeId,
        computeEdgeId,
        resize: {
          getMinNodeSize: () => ({ width: 100, height: 100 }),
        },
        linking: {
          portSnapDistance: 10,
          validateConnection,
          temporaryEdgeDataBuilder: temporaryEdgeBuilder,
          finalEdgeDataBuilder: (edge: TestEdge): TestEdge => edge,
        },
        zoom: {
          min: 0.1,
          max: 10,
          step: 0.05,
        },
      };

      const override: DeepPartial<typeof original> = {
        linking: {
          portSnapDistance: 20,
          temporaryEdgeDataBuilder: (edge: TestEdge): TestEdge => ({ ...edge, type: 'orthogonal' }),
        },
        zoom: {
          max: 5,
        },
      };

      const result = deepMerge(original, override);

      // Functions should be preserved or overridden
      expect(result.computeNodeId).toBe(computeNodeId);
      expect(result.computeEdgeId).toBe(computeEdgeId);
      expect(result.linking.validateConnection).toBe(validateConnection);
      expect(result.linking.temporaryEdgeDataBuilder).not.toBe(temporaryEdgeBuilder);

      // Nested values should be merged
      expect(result.linking.portSnapDistance).toBe(20);
      expect(result.linking.finalEdgeDataBuilder).toBe(original.linking.finalEdgeDataBuilder);
      expect(result.zoom.min).toBe(0.1);
      expect(result.zoom.max).toBe(5);
      expect(result.zoom.step).toBe(0.05);

      // Test that overridden function works
      const testEdge: TestEdge = { id: 'test' };
      const tempEdge = result.linking.temporaryEdgeDataBuilder(testEdge);
      expect(tempEdge).toEqual({ id: 'test', type: 'orthogonal' });
    });
  });
});
