import type { Edge, Node, PortSide } from '../../../types';
import { getPortFlowPositionSide } from '../../../utils';

export const getSourceTarget = (edge: Edge, nodesMap: Map<string, Node>) => {
  const getPoint = (nodeId: string, defaultSide: PortSide, portId?: string) => {
    const node = nodesMap.get(nodeId);
    if (!node) {
      return { side: defaultSide };
    }
    return portId ? getPortFlowPositionSide(node, portId) : { side: defaultSide };
  };
  const sourcePoint = getPoint(edge.source, 'left', edge.sourcePort);
  const targetPoint = getPoint(edge.target, 'right', edge.targetPort);
  return [sourcePoint, targetPoint].filter((point) => !!point);
};
