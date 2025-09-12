import { describe, expect, it } from 'vitest';
import { mockNode, mockPort } from '../../test-utils';
import { getPortFlowPosition, getPortFlowPositionSide } from '../get-port-flow-position';

describe('getFlowPortPosition', () => {
  it('should return null if the port is not found', () => {
    const position = getPortFlowPosition(mockNode, 'port-1');
    expect(position).toBeNull();
  });

  it('should return proper flow port position for top side', () => {
    const position = getPortFlowPosition(
      {
        ...mockNode,
        position: { x: 100, y: 100 },
        measuredPorts: [{ ...mockPort, side: 'top', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
      },
      mockPort.id
    );

    expect(position).toEqual({ x: 155, y: 150 });
  });

  it('should return proper flow port position for bottom side', () => {
    const position = getPortFlowPosition(
      {
        ...mockNode,
        position: { x: 100, y: 100 },
        measuredPorts: [{ ...mockPort, side: 'bottom', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
      },
      mockPort.id
    );

    expect(position).toEqual({ x: 155, y: 160 });
  });

  it('should return proper flow port position for left side', () => {
    const position = getPortFlowPosition(
      {
        ...mockNode,
        position: { x: 100, y: 100 },
        measuredPorts: [{ ...mockPort, side: 'left', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
      },
      mockPort.id
    );

    expect(position).toEqual({ x: 150, y: 155 });
  });

  it('should return proper flow port position for right side', () => {
    const position = getPortFlowPosition(
      {
        ...mockNode,
        position: { x: 100, y: 100 },
        measuredPorts: [{ ...mockPort, side: 'right', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
      },
      mockPort.id
    );

    expect(position).toEqual({ x: 160, y: 155 });
  });

  describe('with node rotation', () => {
    it('should adjust port position for 90 degree rotation', () => {
      const position = getPortFlowPosition(
        {
          ...mockNode,
          angle: 90,
          position: { x: 100, y: 100 },
          measuredPorts: [{ ...mockPort, side: 'top', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
        },
        mockPort.id
      );
      // Top port rotated 90 degrees becomes right side
      expect(position).toEqual({ x: 160, y: 155 });
    });

    it('should adjust port position for 180 degree rotation', () => {
      const position = getPortFlowPosition(
        {
          ...mockNode,
          angle: 180,
          position: { x: 100, y: 100 },
          measuredPorts: [{ ...mockPort, side: 'left', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
        },
        mockPort.id
      );
      // Left port rotated 180 degrees becomes right side
      expect(position).toEqual({ x: 160, y: 155 });
    });

    it('should adjust port position for 270 degree rotation', () => {
      const position = getPortFlowPosition(
        {
          ...mockNode,
          angle: 270,
          position: { x: 100, y: 100 },
          measuredPorts: [{ ...mockPort, side: 'bottom', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
        },
        mockPort.id
      );
      // Bottom port rotated 270 degrees becomes right side
      expect(position).toEqual({ x: 160, y: 155 });
    });
  });
});

describe('getPortFlowPositionSide', () => {
  it('should return null if the port is not found', () => {
    const position = getPortFlowPositionSide(mockNode, 'port-1');
    expect(position).toBeNull();
  });

  it('should return proper flow port position and side for top side', () => {
    const position = getPortFlowPositionSide(
      {
        ...mockNode,
        position: { x: 100, y: 100 },
        measuredPorts: [{ ...mockPort, side: 'top', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
      },
      mockPort.id
    );
    expect(position).toEqual({ x: 155, y: 150, side: 'top' });
  });

  it('should return proper flow port position and side for bottom side', () => {
    const position = getPortFlowPositionSide(
      {
        ...mockNode,
        position: { x: 100, y: 100 },
        measuredPorts: [{ ...mockPort, side: 'bottom', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
      },
      mockPort.id
    );
    expect(position).toEqual({ x: 155, y: 160, side: 'bottom' });
  });

  it('should return proper flow port position and side for left side', () => {
    const position = getPortFlowPositionSide(
      {
        ...mockNode,
        position: { x: 100, y: 100 },
        measuredPorts: [{ ...mockPort, side: 'left', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
      },
      mockPort.id
    );
    expect(position).toEqual({ x: 150, y: 155, side: 'left' });
  });

  it('should return proper flow port position and side for right side', () => {
    const position = getPortFlowPositionSide(
      {
        ...mockNode,
        position: { x: 100, y: 100 },
        measuredPorts: [{ ...mockPort, side: 'right', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
      },
      mockPort.id
    );
    expect(position).toEqual({ x: 160, y: 155, side: 'right' });
  });

  describe('with node rotation', () => {
    it('should rotate port side 90 degrees clockwise', () => {
      const position = getPortFlowPositionSide(
        {
          ...mockNode,
          angle: 90,
          position: { x: 100, y: 100 },
          measuredPorts: [{ ...mockPort, side: 'top', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
        },
        mockPort.id
      );
      expect(position).toEqual({ x: 160, y: 155, side: 'right' });
    });

    it('should rotate port side 180 degrees', () => {
      const position = getPortFlowPositionSide(
        {
          ...mockNode,
          angle: 180,
          position: { x: 100, y: 100 },
          measuredPorts: [{ ...mockPort, side: 'top', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
        },
        mockPort.id
      );
      expect(position).toEqual({ x: 155, y: 160, side: 'bottom' });
    });

    it('should rotate port side 270 degrees clockwise', () => {
      const position = getPortFlowPositionSide(
        {
          ...mockNode,
          angle: 270,
          position: { x: 100, y: 100 },
          measuredPorts: [{ ...mockPort, side: 'top', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
        },
        mockPort.id
      );
      expect(position).toEqual({ x: 150, y: 155, side: 'left' });
    });

    it('should handle rotation for right side port', () => {
      const position = getPortFlowPositionSide(
        {
          ...mockNode,
          angle: 90,
          position: { x: 100, y: 100 },
          measuredPorts: [{ ...mockPort, side: 'right', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
        },
        mockPort.id
      );
      expect(position).toEqual({ x: 155, y: 160, side: 'bottom' });
    });

    it('should handle zero rotation', () => {
      const position = getPortFlowPositionSide(
        {
          ...mockNode,
          angle: 0,
          position: { x: 100, y: 100 },
          measuredPorts: [{ ...mockPort, side: 'top', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
        },
        mockPort.id
      );
      expect(position).toEqual({ x: 155, y: 150, side: 'top' });
    });

    it('should handle rotation greater than 360 degrees', () => {
      const position = getPortFlowPositionSide(
        {
          ...mockNode,
          angle: 450, // 450 % 360 = 90
          position: { x: 100, y: 100 },
          measuredPorts: [{ ...mockPort, side: 'top', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
        },
        mockPort.id
      );
      expect(position).toEqual({ x: 160, y: 155, side: 'right' });
    });
  });
});
