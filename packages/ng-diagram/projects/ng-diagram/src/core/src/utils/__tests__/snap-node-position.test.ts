import { describe, expect, it } from 'vitest';
import { mockNode } from '../../test-utils';
import type { FlowConfig, SnappingConfig } from '../../types';
import { snapNodePosition } from '../snap-node-position';

const createConfig = (overrides: Partial<SnappingConfig> = {}): FlowConfig =>
  ({
    snapping: {
      shouldSnapDragForNode: () => true,
      shouldSnapResizeForNode: () => false,
      computeSnapForNodeDrag: () => null,
      computeSnapForNodeSize: () => null,
      defaultDragSnap: { width: 10, height: 10 },
      defaultResizeSnap: { width: 10, height: 10 },
      ...overrides,
    },
  }) as unknown as FlowConfig;

describe('snapNodePosition', () => {
  it('should return the original position when snapping is disabled', () => {
    const config = createConfig({ shouldSnapDragForNode: () => false });
    const position = { x: 13, y: 27 };

    const result = snapNodePosition(config, mockNode, position);

    expect(result).toBe(position);
  });

  it('should snap position to defaultDragSnap grid', () => {
    const config = createConfig({ defaultDragSnap: { width: 20, height: 20 } });

    const result = snapNodePosition(config, mockNode, { x: 13, y: 27 });

    expect(result).toEqual({ x: 20, y: 20 });
  });

  it('should use computeSnapForNodeDrag when it returns a value', () => {
    const config = createConfig({
      computeSnapForNodeDrag: () => ({ width: 50, height: 50 }),
      defaultDragSnap: { width: 10, height: 10 },
    });

    const result = snapNodePosition(config, mockNode, { x: 123, y: 167 });

    expect(result).toEqual({ x: 100, y: 150 });
  });

  it('should fall back to defaultDragSnap when computeSnapForNodeDrag returns null', () => {
    const config = createConfig({
      computeSnapForNodeDrag: () => null,
      defaultDragSnap: { width: 25, height: 25 },
    });

    const result = snapNodePosition(config, mockNode, { x: 37, y: 63 });

    expect(result).toEqual({ x: 25, y: 75 });
  });

  it('should pass the node to shouldSnapDragForNode', () => {
    const node = { ...mockNode, id: 'special-node' };
    const config = createConfig({
      shouldSnapDragForNode: (n) => n.id === 'special-node',
    });

    const snapped = snapNodePosition(config, node, { x: 13, y: 27 });
    expect(snapped).toEqual({ x: 10, y: 30 });

    const otherNode = { ...mockNode, id: 'other-node' };
    const unsnapped = snapNodePosition(config, otherNode, { x: 13, y: 27 });
    expect(unsnapped).toEqual({ x: 13, y: 27 });
  });

  it('should pass the node to computeSnapForNodeDrag', () => {
    const config = createConfig({
      computeSnapForNodeDrag: (n) => (n.id === 'grid-50' ? { width: 50, height: 50 } : null),
      defaultDragSnap: { width: 10, height: 10 },
    });

    const node50 = { ...mockNode, id: 'grid-50' };
    expect(snapNodePosition(config, node50, { x: 73, y: 73 })).toEqual({ x: 50, y: 50 });

    const nodeDefault = { ...mockNode, id: 'other' };
    expect(snapNodePosition(config, nodeDefault, { x: 73, y: 73 })).toEqual({ x: 70, y: 70 });
  });

  it('should snap position that is already on grid', () => {
    const config = createConfig({ defaultDragSnap: { width: 20, height: 20 } });

    const result = snapNodePosition(config, mockNode, { x: 40, y: 60 });

    expect(result).toEqual({ x: 40, y: 60 });
  });

  it('should handle asymmetric snap sizes', () => {
    const config = createConfig({ defaultDragSnap: { width: 10, height: 50 } });

    const result = snapNodePosition(config, mockNode, { x: 13, y: 130 });

    expect(result).toEqual({ x: 10, y: 150 });
  });
});
