import type { Edge, Node, PortSide } from '../../../types';
import { getPortFlowPositionSide } from '../../../utils';
import { getHandlePosition } from './get-rotated-position.ts';

export const getSourceTarget = (edge: Edge, nodesMap: Map<string, Node>) => {
  const getPoint = (nodeId: string, defaultSide: PortSide, portId?: string) => {
    const node = nodesMap.get(nodeId);

    if (!node || !portId) {
      return { side: defaultSide };
    }
    const position = getPortFlowPositionSide(node, portId);
    const angle = node?.angle;
    if (angle != null && position?.side) {
      const newPortSide = getHandlePosition(position?.side, angle);
      if (newPortSide !== position?.side) {
        position.side = newPortSide;
      }
    }
    return position;
  };
  const sourcePoint = getPoint(edge.source, 'left', edge.sourcePort);
  const targetPoint = getPoint(edge.target, 'right', edge.targetPort);
  return [sourcePoint, targetPoint].filter((point) => !!point);
};
