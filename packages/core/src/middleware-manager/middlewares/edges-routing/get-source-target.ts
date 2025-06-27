import type { Edge, Node, PortSide } from '../../../types';
import { getPortFlowPositionSide } from '../../../utils';

export const getSourceTarget = (edge: Edge, nodesMap: Map<string, Node>) => {
  const getPoint = (nodeId: string, defaultSide: PortSide, portId?: string, position?: { x: number; y: number }) => {
    const node = nodesMap.get(nodeId);
    if (!node) {
      return { ...position, side: defaultSide };
    }
    return portId ? getPortFlowPositionSide(node, portId) : { ...position, side: defaultSide };
  };
  const sourcePoint = getPoint(edge.source, 'right', edge.sourcePort, edge.sourcePosition);
  const targetPoint = getPoint(edge.target, 'left', edge.targetPort, edge.targetPosition);
  return [sourcePoint, targetPoint].filter((point) => !!point);
};
