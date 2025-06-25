import { describe, expect, it } from 'vitest';
import { mockNode, mockPort } from '../../test-utils';
import { getPortFlowPosition } from '../get-port-flow-position';

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
        ports: [{ ...mockPort, side: 'top', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
      },
      mockPort.id
    );

    expect(position).toEqual({ x: 155, y: 150, side: 'top' });
  });

  it('should return proper flow port position for bottom side', () => {
    const position = getPortFlowPosition(
      {
        ...mockNode,
        position: { x: 100, y: 100 },
        ports: [{ ...mockPort, side: 'bottom', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
      },
      mockPort.id
    );

    expect(position).toEqual({ x: 155, y: 160, side: 'bottom' });
  });

  it('should return proper flow port position for left side', () => {
    const position = getPortFlowPosition(
      {
        ...mockNode,
        position: { x: 100, y: 100 },
        ports: [{ ...mockPort, side: 'left', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
      },
      mockPort.id
    );

    expect(position).toEqual({ x: 150, y: 155, side: 'left' });
  });

  it('should return proper flow port position for right side', () => {
    const position = getPortFlowPosition(
      {
        ...mockNode,
        position: { x: 100, y: 100 },
        ports: [{ ...mockPort, side: 'right', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } }],
      },
      mockPort.id
    );

    expect(position).toEqual({ x: 160, y: 155, side: 'right' });
  });
});
