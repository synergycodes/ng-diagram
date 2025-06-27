import type { Edge, Node, PortSide } from '../../../types';
import { getPortFlowPositionSide } from '../../../utils';
import { getHandlePosition } from './get-rotated-position.ts';

export const getSourceTarget = (edge: Edge, nodesMap: Map<string, Node>) => {
  const getPoint = (nodeId: string, defaultSide: PortSide, portId?: string, position?: { x: number; y: number }) => {
    const node = nodesMap.get(nodeId);

    if (!node || !portId) {
      return { ...position, side: defaultSide };
    }
    const portPosition = getPortFlowPositionSide(node, portId);
    const angle = node?.angle;
    if (angle != null && portPosition?.side) {
      const newPortSide = getHandlePosition(portPosition?.side, angle);
      if (newPortSide !== portPosition?.side) {
        portPosition.side = newPortSide;
      }
    }
    return portPosition;
  };
  const sourcePoint = getPoint(edge.source, 'right', edge.sourcePort, edge.sourcePosition);
  const targetPoint = getPoint(edge.target, 'left', edge.targetPort, edge.targetPosition);
  return [sourcePoint, targetPoint].filter((point) => !!point);
};
