/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { Node } from '../../../../types';
import { isNodeFullyMeasured } from '../is-node-fully-measured';

describe('isNodeFullyMeasured', () => {
  it('should return true for node with valid size and position, no ports', () => {
    const node: Node = {
      id: 'node1',
      position: { x: 100, y: 50 },
      size: { width: 200, height: 100 },
      data: {},
    };
    expect(isNodeFullyMeasured(node)).toBe(true);
  });

  it('should return true for node with valid size, position, and measured ports', () => {
    const node: Node = {
      id: 'node1',
      position: { x: 100, y: 50 },
      size: { width: 200, height: 100 },
      data: {},
      measuredPorts: [
        {
          id: 'port1',
          position: { x: 10, y: 10 },
          size: { width: 20, height: 20 },
          type: 'both',
          nodeId: 'node1',
          side: 'top',
        },
        {
          id: 'port2',
          position: { x: 0, y: 0 },
          size: { width: 15, height: 15 },
          type: 'both',
          nodeId: 'node1',
          side: 'bottom',
        },
      ],
    };
    expect(isNodeFullyMeasured(node)).toBe(true);
  });

  it('should return true for node at origin (0, 0)', () => {
    const node: Node = {
      id: 'node1',
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      data: {},
    };
    expect(isNodeFullyMeasured(node)).toBe(true);
  });

  it('should return false for node with zero width', () => {
    const node: Node = {
      id: 'node1',
      position: { x: 100, y: 50 },
      size: { width: 0, height: 100 },
      data: {},
    };
    expect(isNodeFullyMeasured(node)).toBe(false);
  });

  it('should return false for node with zero height', () => {
    const node: Node = {
      id: 'node1',
      position: { x: 100, y: 50 },
      size: { width: 200, height: 0 },
      data: {},
    };
    expect(isNodeFullyMeasured(node)).toBe(false);
  });

  it('should return false for node with undefined size', () => {
    const node: Node = {
      id: 'node1',
      position: { x: 100, y: 50 },
      size: undefined,
      data: {},
    };
    expect(isNodeFullyMeasured(node)).toBe(false);
  });

  it('should return false for node with undefined position', () => {
    const node: Node = {
      id: 'node1',
      position: undefined as any,
      size: { width: 200, height: 100 },
      data: {},
    };
    expect(isNodeFullyMeasured(node)).toBe(false);
  });

  it('should return false for node with null position coordinates', () => {
    const node: Node = {
      id: 'node1',
      position: { x: null as unknown as number, y: 50 },
      size: { width: 200, height: 100 },
      data: {},
    };
    expect(isNodeFullyMeasured(node)).toBe(false);
  });

  it('should return false when any port has invalid size', () => {
    const node: Node = {
      id: 'node1',
      position: { x: 100, y: 50 },
      size: { width: 200, height: 100 },
      data: {},
      measuredPorts: [
        {
          id: 'port1',
          position: { x: 10, y: 10 },
          size: { width: 20, height: 20 },
          type: 'both',
          nodeId: 'node1',
          side: 'top',
        },
        {
          id: 'port2',
          position: { x: 10, y: 10 },
          size: { width: 0, height: 15 },
          type: 'both',
          nodeId: 'node1',
          side: 'bottom',
        }, // Invalid
      ],
    };
    expect(isNodeFullyMeasured(node)).toBe(false);
  });

  it('should return false when any port has invalid position', () => {
    const node: Node = {
      id: 'node1',
      position: { x: 100, y: 50 },
      size: { width: 200, height: 100 },
      data: {},
      measuredPorts: [
        {
          id: 'port1',
          position: { x: 10, y: 10 },
          size: { width: 20, height: 20 },
          type: 'both',
          nodeId: 'node1',
          side: 'top',
        },
        {
          id: 'port2',
          position: undefined,
          size: { width: 15, height: 15 },
          type: 'both',
          nodeId: 'node1',
          side: 'bottom',
        }, // Invalid
      ],
    };
    expect(isNodeFullyMeasured(node)).toBe(false);
  });

  it('should return false when any port has null position coordinates', () => {
    const node: Node = {
      id: 'node1',
      position: { x: 100, y: 50 },
      size: { width: 200, height: 100 },
      data: {},
      measuredPorts: [
        {
          id: 'port1',
          position: { x: 10, y: 10 },
          size: { width: 20, height: 20 },
          type: 'both',
          nodeId: 'node1',
          side: 'top',
        },
        {
          id: 'port2',
          position: { x: null as unknown as number, y: 10 },
          size: { width: 15, height: 15 },
          type: 'both',
          nodeId: 'node1',
          side: 'bottom',
        }, // Invalid
      ],
    };
    expect(isNodeFullyMeasured(node)).toBe(false);
  });

  it('should return true for node with empty measuredPorts array', () => {
    const node: Node = {
      id: 'node1',
      position: { x: 100, y: 50 },
      size: { width: 200, height: 100 },
      data: {},
      measuredPorts: [],
    };
    expect(isNodeFullyMeasured(node)).toBe(true);
  });

  it('should return true for node with undefined measuredPorts', () => {
    const node: Node = {
      id: 'node1',
      position: { x: 100, y: 50 },
      size: { width: 200, height: 100 },
      data: {},
      measuredPorts: undefined,
    };
    expect(isNodeFullyMeasured(node)).toBe(true);
  });
});
