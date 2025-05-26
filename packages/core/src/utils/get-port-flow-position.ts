import { Node } from '../types';

export const getFlowPortPosition = (node: Node, portId: string) => {
  const port = node.ports?.find((port) => port.id === portId);
  if (!port) {
    return null;
  }
  let x = port.position.x + node.position.x;
  let y = port.position.y + node.position.y;
  if (port.side === 'left') {
    y = y + port.size.width / 2;
  } else if (port.side === 'right') {
    x = x + port.size.width;
    y = y + port.size.height / 2;
  } else if (port.side === 'top') {
    x = x + port.size.width / 2;
  } else if (port.side === 'bottom') {
    x = x + port.size.width / 2;
    y = y + port.size.height;
  }
  return { x, y };
};
