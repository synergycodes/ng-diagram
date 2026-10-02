import { describe, expect, it } from 'vitest';
import type { Node } from '../../../core/src';
import { calculateBoundsFromPositions } from './ng-diagram-minimap.calculations';

const node = (id: string, overrides: Partial<Node> = {}): Node =>
  ({
    id,
    type: 'default',
    position: { x: 0, y: 0 },
    size: { width: 100, height: 50 },
    data: {},
    ...overrides,
  }) as Node;

describe('calculateBoundsFromPositions', () => {
  it('excludes effectively hidden nodes from the bounds', () => {
    const bounds = calculateBoundsFromPositions([
      node('near'),
      node('far-hidden', { hidden: true, computedHidden: true, position: { x: 5000, y: 5000 } }),
    ]);

    expect(bounds).toEqual({ x: 0, y: 0, width: 100, height: 50 });
  });

  it('excludes children hidden through an ancestor group', () => {
    // The child carries only the computedHidden stamp derived from its hidden
    // ancestor — effective visibility, not the own flag, decides.
    const bounds = calculateBoundsFromPositions([
      node('group', { isGroup: true, hidden: true, computedHidden: true } as Partial<Node>),
      node('child', { groupId: 'group', computedHidden: true, position: { x: 900, y: 900 } }),
      node('outsider', { position: { x: 100, y: 100 } }),
    ]);

    expect(bounds).toEqual({ x: 100, y: 100, width: 100, height: 50 });
  });

  it('includes a node again once it is unhidden', () => {
    const far = { position: { x: 500, y: 300 } };
    const hiddenBounds = calculateBoundsFromPositions([
      node('near'),
      node('far', { ...far, hidden: true, computedHidden: true }),
    ]);
    expect(hiddenBounds).toEqual({ x: 0, y: 0, width: 100, height: 50 });

    const visibleBounds = calculateBoundsFromPositions([node('near'), node('far', far)]);
    expect(visibleBounds).toEqual({ x: 0, y: 0, width: 600, height: 350 });
  });

  it('falls back to a zero rect when every node is hidden', () => {
    const bounds = calculateBoundsFromPositions([node('only', { hidden: true, computedHidden: true })]);

    expect(bounds).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });
});
