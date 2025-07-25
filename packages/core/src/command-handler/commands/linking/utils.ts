import { FlowCore } from '../../../flow-core';
import type { Edge, FlowConfig, Port } from '../../../types';

export const createFinalEdge = (config: FlowConfig, temporaryEdge: Edge, partialEdge: Partial<Edge>): Edge => {
  const data = {
    ...temporaryEdge,
    ...partialEdge,
    temporary: false,
  };
  return config.linking.finalEdgeDataBuilder({
    ...data,
    id: config.computeEdgeId(data),
  });
};

export const isProperTargetPort = (targetPort: Port, sourceNodeId?: string, sourcePortId?: string) => {
  if (targetPort.type === 'source') {
    return false;
  }
  if (sourceNodeId && targetPort.nodeId !== sourceNodeId) {
    return true;
  }
  if (sourcePortId && targetPort.id !== sourcePortId) {
    return true;
  }
  return false;
};

export const validateConnection = (
  core: FlowCore,
  sourceNodeId?: string,
  sourcePortId?: string,
  targetNodeId?: string,
  targetPortId?: string,
  isFinishLinking?: boolean
) => {
  const sourceNode = sourceNodeId ? core.getNodeById(sourceNodeId) : null;
  const targetNode = targetNodeId ? core.getNodeById(targetNodeId) : null;
  const sourcePort = sourcePortId ? (sourceNode?.ports?.find((port) => port.id === sourcePortId) ?? null) : null;
  const targetPort = targetPortId ? (targetNode?.ports?.find((port) => port.id === targetPortId) ?? null) : null;

  // Dragging temporary edge case without snapping to target port
  if (!isFinishLinking && sourcePort && !targetPort) {
    return true;
  }

  return core.config.linking.validateConnection(sourceNode, sourcePort, targetNode, targetPort);
};

export const createTemporaryEdge = (config: FlowConfig, partialEdge: Partial<Edge>): Edge => {
  return config.linking.temporaryEdgeDataBuilder({
    id: 'TEMPORARY_EDGE',
    data: {},
    temporary: true,
    ...partialEdge,
    source: partialEdge.source || '',
    target: partialEdge.target || '',
  });
};
