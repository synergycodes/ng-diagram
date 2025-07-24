import { FlowCore } from '../../../flow-core';
import type { Edge, Port } from '../../../types';

export const createFinalEdge = (temporaryEdge: Edge, partialEdge: Partial<Edge>): Edge => ({
  ...temporaryEdge,
  ...partialEdge,
  temporary: false,
  id: crypto.randomUUID(),
});

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
  const sourcePort = sourcePortId ? sourceNode?.ports?.find((port) => port.id === sourcePortId) : null;

  const targetPort = targetPortId ? targetNode?.ports?.find((port) => port.id === targetPortId) : null;

  if (!isFinishLinking && !targetPort && sourcePort) {
    return true;
  }

  return true;
};

export const createTemporaryEdge = (core: FlowCore, partialEdge: Partial<Edge>): Edge => {
  console.log(core);
  return {
    id: 'TEMPORARY_EDGE',
    data: {},
    temporary: true,
    ...partialEdge,
    source: partialEdge.source || '',
    target: partialEdge.target || '',
  };
};
