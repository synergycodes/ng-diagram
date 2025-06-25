import { Node, Port } from '../types';
import { getRect } from './rects-points-sizes';

export const getPortPosition = (port: Port, node: Node) => {
  const { x: px, y: py, width: pw, height: ph } = getRect(port);

  const x = px + node.position.x;
  const y = py + node.position.y;

  if (port.side === 'left') {
    return { x, y: y + ph / 2 };
  }

  if (port.side === 'top') {
    return { x: x + pw / 2, y };
  }

  if (port.side === 'bottom') {
    return { x: x + pw / 2, y: y + ph };
  }

  if (port.side === 'right') {
    return { x: x + pw, y: y + ph / 2 };
  }

  return { x, y };
};

export const getPortFlowPosition = (node: Node, portId: string) => {
  const port = node.ports?.find((port) => port.id === portId);
  if (!port) {
    return null;
  }

  return getPortPosition(port, node);
};

export const getPortFlowPositionSide = (node: Node, portId: string) => {
  const port = node.ports?.find((port) => port.id === portId);
  if (!port) {
    return null;
  }

  const position = getPortPosition(port, node);

  return { ...position, side: port.side };
};
