import { Node, Port, PortSide } from '../types';
import { getRect } from './rects-points-sizes';

/**
 * Returns the new position of a handle after a given rotation.
 */
const getRotatedPortSide = (initialPosition: PortSide, rotation: number): PortSide => {
  const positionMap: Record<PortSide, PortSide[]> = {
    top: ['top', 'right', 'bottom', 'left'],
    right: ['right', 'bottom', 'left', 'top'],
    bottom: ['bottom', 'left', 'top', 'right'],
    left: ['left', 'top', 'right', 'bottom'],
  };

  // Calculate the rotation index (0° -> 0, 90° -> 1, 180° -> 2, 270° -> 3)
  const rotationIndex = Math.floor(rotation / 90) % 4;

  return positionMap[initialPosition][rotationIndex];
};

/**
 * Gets the port position, automatically handling rotation if the node is rotated
 * @param port The port to get position for
 * @param node The node containing the port
 */
export const getPortPosition = (port: Port, node: Node) => {
  const { x: px, y: py, width: pw, height: ph } = getRect(port);

  const x = px + node.position.x;
  const y = py + node.position.y;

  // Determine the actual side based on node rotation
  let actualSide = port.side;
  if (node.angle && node.angle !== 0) {
    actualSide = getRotatedPortSide(port.side, node.angle);
  }

  if (actualSide === 'left') {
    return { x, y: y + ph / 2 };
  }

  if (actualSide === 'top') {
    return { x: x + pw / 2, y };
  }

  if (actualSide === 'bottom') {
    return { x: x + pw / 2, y: y + ph };
  }

  if (actualSide === 'right') {
    return { x: x + pw, y: y + ph / 2 };
  }

  return { x, y };
};

export const getPortFlowPosition = (node: Node, portId: string) => {
  const port = node.measuredPorts?.find((port) => port.id === portId);
  if (!port) {
    return null;
  }

  return getPortPosition(port, node);
};

export const getPortFlowPositionSide = (node: Node, portId: string) => {
  const port = node.measuredPorts?.find((port) => port.id === portId);
  if (!port) {
    return null;
  }

  const position = getPortPosition(port, node);

  let actualSide = port.side;
  if (node.angle && node.angle !== 0) {
    actualSide = getRotatedPortSide(port.side, node.angle);
  }

  return { ...position, side: actualSide };
};
