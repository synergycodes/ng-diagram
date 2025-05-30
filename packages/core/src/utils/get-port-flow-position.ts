import { Node } from '../types';
import { getRect } from './rects-points-sizes';

export const getPortFlowPosition = (node: Node, portId: string) => {
  const port = node.ports?.find((port) => port.id === portId);
  if (!port) {
    return null;
  }
  const { x: px, y: py, width: pw, height: ph } = getRect(port);
  const x = px + node.position.x;
  const y = py + node.position.y;

  if (port.side === 'left') {
    return { x, y: y + ph / 2 };
  }

  if (port.side === 'right') {
    return { x: x + pw, y: y + ph / 2 };
  }

  if (port.side === 'top') {
    return { x: x + pw / 2, y };
  }

  if (port.side === 'bottom') {
    return { x: x + pw / 2, y: y + ph };
  }

  return { x, y };
};
