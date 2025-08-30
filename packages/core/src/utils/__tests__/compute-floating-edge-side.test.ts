import { describe, expect, it } from 'vitest';
import { mockNode, mockPort } from '../../test-utils';
import type { Node, Point } from '../../types';
import { computeFloatingEndSide, computeFloatingStartSide } from '../compute-floating-edge-side';

describe('computeFloatingEndSide', () => {
  const createNodeWithPort = (x: number, y: number, portX = 50, portY = 25): Node => ({
    ...mockNode,
    position: { x, y },
    size: { width: 100, height: 50 },
    ports: [
      {
        ...mockPort,
        id: 'test-port',
        position: { x: portX, y: portY },
        size: { width: 10, height: 10 },
      },
    ],
  });

  describe('without port', () => {
    it('should return left when cursor is to the right of node center', () => {
      const node: Node = {
        ...mockNode,
        position: { x: 100, y: 100 },
        size: { width: 100, height: 50 },
      };
      const cursorPosition: Point = { x: 250, y: 125 }; // Right of center (150, 125)

      const side = computeFloatingEndSide(node, undefined, cursorPosition);
      expect(side).toBe('left');
    });

    it('should return top when cursor is below node center', () => {
      const node: Node = {
        ...mockNode,
        position: { x: 100, y: 100 },
        size: { width: 100, height: 50 },
      };
      const cursorPosition: Point = { x: 150, y: 200 }; // Below center (150, 125)

      const side = computeFloatingEndSide(node, undefined, cursorPosition);
      expect(side).toBe('top');
    });

    it('should return right when cursor is to the left of node center', () => {
      const node: Node = {
        ...mockNode,
        position: { x: 100, y: 100 },
        size: { width: 100, height: 50 },
      };
      const cursorPosition: Point = { x: 50, y: 125 }; // Left of center (150, 125)

      const side = computeFloatingEndSide(node, undefined, cursorPosition);
      expect(side).toBe('right');
    });

    it('should return bottom when cursor is above node center', () => {
      const node: Node = {
        ...mockNode,
        position: { x: 100, y: 100 },
        size: { width: 100, height: 50 },
      };
      const cursorPosition: Point = { x: 150, y: 50 }; // Above center (150, 125)

      const side = computeFloatingEndSide(node, undefined, cursorPosition);
      expect(side).toBe('bottom');
    });
  });

  describe('with port', () => {
    it('should use port position when available', () => {
      const node = createNodeWithPort(100, 100, 80, 25); // Port at right side
      const cursorPosition: Point = { x: 250, y: 125 };

      const side = computeFloatingEndSide(node, 'test-port', cursorPosition);
      expect(side).toBe('left'); // Cursor is to the right of port
    });

    it('should handle port on left side of node', () => {
      const node = createNodeWithPort(100, 100, 10, 25); // Port at left side
      const cursorPosition: Point = { x: 50, y: 125 };

      const side = computeFloatingEndSide(node, 'test-port', cursorPosition);
      expect(side).toBe('right'); // Cursor is to the left of port
    });

    it('should handle port on top of node', () => {
      const node = createNodeWithPort(100, 100, 50, 5); // Port at top
      const cursorPosition: Point = { x: 155, y: 50 };

      const side = computeFloatingEndSide(node, 'test-port', cursorPosition);
      expect(side).toBe('bottom'); // Cursor is above port
    });

    it('should handle port on bottom of node', () => {
      const node = createNodeWithPort(100, 100, 50, 45); // Port at bottom
      const cursorPosition: Point = { x: 155, y: 200 };

      const side = computeFloatingEndSide(node, 'test-port', cursorPosition);
      expect(side).toBe('top'); // Cursor is below port
    });

    it('should fallback to node center if port has no position', () => {
      const node: Node = {
        ...mockNode,
        position: { x: 100, y: 100 },
        size: { width: 100, height: 50 },
        ports: [
          {
            ...mockPort,
            id: 'test-port',
            position: undefined,
            size: undefined,
          },
        ],
      };
      const cursorPosition: Point = { x: 250, y: 125 };

      const side = computeFloatingEndSide(node, 'test-port', cursorPosition);
      expect(side).toBe('left');
    });
  });

  describe('diagonal positions', () => {
    it('should return left for cursor at 30 degrees (right-ish)', () => {
      const node = createNodeWithPort(100, 100);
      const cursorPosition: Point = { x: 200, y: 140 }; // Roughly 30 degrees from port

      const side = computeFloatingEndSide(node, 'test-port', cursorPosition);
      expect(side).toBe('left');
    });

    it('should return top for cursor at 60 degrees (bottom-right)', () => {
      const node = createNodeWithPort(100, 100);
      const cursorPosition: Point = { x: 175, y: 170 }; // Roughly 60 degrees from port

      const side = computeFloatingEndSide(node, 'test-port', cursorPosition);
      expect(side).toBe('top');
    });

    it('should return right for cursor at 150 degrees (bottom-left)', () => {
      const node = createNodeWithPort(100, 100);
      const cursorPosition: Point = { x: 115, y: 165 }; // Roughly 150 degrees from port

      const side = computeFloatingEndSide(node, 'test-port', cursorPosition);
      expect(side).toBe('right');
    });

    it('should return bottom for cursor at 240 degrees (top-left)', () => {
      const node = createNodeWithPort(100, 100);
      const cursorPosition: Point = { x: 125, y: 80 }; // Roughly 240 degrees from port

      const side = computeFloatingEndSide(node, 'test-port', cursorPosition);
      expect(side).toBe('bottom');
    });
  });

  describe('edge cases', () => {
    it('should return left when node is undefined', () => {
      const cursorPosition: Point = { x: 100, y: 100 };

      const side = computeFloatingEndSide(undefined, undefined, cursorPosition);
      expect(side).toBe('left');
    });

    it('should use node center when port id is not found', () => {
      const node = createNodeWithPort(100, 100);
      const cursorPosition: Point = { x: 250, y: 125 };

      const side = computeFloatingEndSide(node, 'non-existent-port', cursorPosition);
      expect(side).toBe('left');
    });

    it('should handle node without size property', () => {
      const node: Node = {
        ...mockNode,
        position: { x: 100, y: 100 },
        size: undefined,
      };
      const cursorPosition: Point = { x: 250, y: 125 };

      // Should use default size (100, 50)
      const side = computeFloatingEndSide(node, undefined, cursorPosition);
      expect(side).toBe('left');
    });

    it('should handle exact boundary angles', () => {
      const node = createNodeWithPort(100, 100, 50, 25);

      // Exactly at 45 degrees (boundary between right and bottom)
      const cursor45: Point = { x: 180, y: 155 };
      expect(computeFloatingEndSide(node, 'test-port', cursor45)).toBe('top');

      // Exactly at 135 degrees (boundary between bottom and left)
      const cursor135: Point = { x: 130, y: 155 };
      expect(computeFloatingEndSide(node, 'test-port', cursor135)).toBe('right');

      // Exactly at 225 degrees (boundary between left and top)
      const cursor225: Point = { x: 130, y: 105 };
      expect(computeFloatingEndSide(node, 'test-port', cursor225)).toBe('bottom');

      // Exactly at 315 degrees (boundary between top and right)
      const cursor315: Point = { x: 180, y: 105 };
      expect(computeFloatingEndSide(node, 'test-port', cursor315)).toBe('left');
    });
  });
});

describe('computeFloatingStartSide', () => {
  it('should return right when end is to the right', () => {
    const startPosition: Point = { x: 100, y: 100 };
    const endPosition: Point = { x: 200, y: 100 };

    const side = computeFloatingStartSide(startPosition, endPosition);
    expect(side).toBe('right');
  });

  it('should return bottom when end is below', () => {
    const startPosition: Point = { x: 100, y: 100 };
    const endPosition: Point = { x: 100, y: 200 };

    const side = computeFloatingStartSide(startPosition, endPosition);
    expect(side).toBe('bottom');
  });

  it('should return left when end is to the left', () => {
    const startPosition: Point = { x: 100, y: 100 };
    const endPosition: Point = { x: 0, y: 100 };

    const side = computeFloatingStartSide(startPosition, endPosition);
    expect(side).toBe('left');
  });

  it('should return top when end is above', () => {
    const startPosition: Point = { x: 100, y: 100 };
    const endPosition: Point = { x: 100, y: 0 };

    const side = computeFloatingStartSide(startPosition, endPosition);
    expect(side).toBe('top');
  });

  describe('diagonal positions', () => {
    it('should handle diagonal at 30 degrees', () => {
      const startPosition: Point = { x: 100, y: 100 };
      const endPosition: Point = { x: 150, y: 115 }; // Roughly 30 degrees

      const side = computeFloatingStartSide(startPosition, endPosition);
      expect(side).toBe('right');
    });

    it('should handle diagonal at 60 degrees', () => {
      const startPosition: Point = { x: 100, y: 100 };
      const endPosition: Point = { x: 125, y: 145 }; // Roughly 60 degrees

      const side = computeFloatingStartSide(startPosition, endPosition);
      expect(side).toBe('bottom');
    });

    it('should handle diagonal at 150 degrees', () => {
      const startPosition: Point = { x: 100, y: 100 };
      const endPosition: Point = { x: 60, y: 130 }; // Roughly 150 degrees

      const side = computeFloatingStartSide(startPosition, endPosition);
      expect(side).toBe('left');
    });

    it('should handle diagonal at 240 degrees', () => {
      const startPosition: Point = { x: 100, y: 100 };
      const endPosition: Point = { x: 75, y: 55 }; // Roughly 240 degrees

      const side = computeFloatingStartSide(startPosition, endPosition);
      expect(side).toBe('top');
    });
  });

  describe('edge cases', () => {
    it('should handle exact boundary angles', () => {
      const startPosition: Point = { x: 100, y: 100 };

      // Exactly at 45 degrees
      const end45: Point = { x: 130, y: 130 };
      expect(computeFloatingStartSide(startPosition, end45)).toBe('bottom');

      // Exactly at 135 degrees
      const end135: Point = { x: 70, y: 130 };
      expect(computeFloatingStartSide(startPosition, end135)).toBe('left');

      // Exactly at 225 degrees
      const end225: Point = { x: 70, y: 70 };
      expect(computeFloatingStartSide(startPosition, end225)).toBe('top');

      // Exactly at 315 degrees
      const end315: Point = { x: 130, y: 70 };
      expect(computeFloatingStartSide(startPosition, end315)).toBe('right');
    });

    it('should handle same position (0 angle)', () => {
      const startPosition: Point = { x: 100, y: 100 };
      const endPosition: Point = { x: 100, y: 100 };

      // When positions are the same, angle is 0, which should be right
      const side = computeFloatingStartSide(startPosition, endPosition);
      expect(side).toBe('right');
    });

    it('should handle very small differences', () => {
      const startPosition: Point = { x: 100, y: 100 };
      const endPosition: Point = { x: 100.001, y: 100 };

      const side = computeFloatingStartSide(startPosition, endPosition);
      expect(side).toBe('right');
    });
  });
});
