import { FlowCore } from '../../../flow-core';
import type { Edge, FlowConfig, Port } from '../../../types';
import type { LinkingRelinkContext } from '../../../types/action-state.interface';

export const createFinalEdge = (config: FlowConfig, temporaryEdge: Edge, partialEdge: Partial<Edge>): Edge => {
  const data = {
    ...temporaryEdge,
    ...partialEdge,
    temporary: false,
  };
  return config.linking.finalEdgeDataBuilder({
    ...data,
    id: config.computeEdgeId(),
  });
};

export const isProperTargetPort = (targetPort: Port, sourceNodeId?: string, sourcePortId?: string) => {
  if (targetPort.type === 'source') {
    return false;
  }
  // A draw with no source at all (started from empty canvas, or relinking an
  // edge whose other end is dangling) can target any target-capable port.
  if (!sourceNodeId && !sourcePortId) {
    return true;
  }
  if (sourceNodeId && targetPort.nodeId !== sourceNodeId) {
    return true;
  }
  if (sourcePortId && targetPort.id !== sourcePortId) {
    return true;
  }
  return false;
};

/**
 * Mirror of `isProperTargetPort` for the source end — used while relinking the
 * source endpoint of an edge: the candidate port becomes the edge's source, so
 * it must be source-capable and distinct from the fixed target end.
 */
export const isProperSourcePort = (sourcePort: Port, targetNodeId?: string, targetPortId?: string) => {
  if (sourcePort.type === 'target') {
    return false;
  }
  if (!targetNodeId && !targetPortId) {
    return true;
  }
  if (targetNodeId && sourcePort.nodeId !== targetNodeId) {
    return true;
  }
  if (targetPortId && sourcePort.id !== targetPortId) {
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
  const sourcePort = sourcePortId
    ? (sourceNode?.measuredPorts?.find((port) => port.id === sourcePortId) ?? null)
    : null;
  const targetPort = targetPortId
    ? (targetNode?.measuredPorts?.find((port) => port.id === targetPortId) ?? null)
    : null;

  // Dragging temporary edge case without snapping to target port
  if (!isFinishLinking && sourcePort && !targetPort) {
    return true;
  }

  return core.config.linking.validateConnection(sourceNode, sourcePort, targetNode, targetPort);
};

/**
 * Fields of an edge carried into its relink preview (the temporary edge shown
 * while an endpoint is dragged) so the preview looks like the original edge.
 * The arrowhead keys are present explicitly (possibly undefined) so
 * `createTemporaryEdge` doesn't inject its default arrowhead into the preview
 * of an arrowless edge.
 */
export const relinkPreviewBase = (edge: Edge): Partial<Edge> => ({
  type: edge.type,
  data: edge.data,
  routing: edge.routing,
  sourceArrowhead: edge.sourceArrowhead,
  targetArrowhead: edge.targetArrowhead,
});

export const createTemporaryEdge = (config: FlowConfig, partialEdge: Partial<Edge>): Edge => {
  // The default arrowhead applies only when the caller doesn't mention the
  // property at all — a relink preview passes the original edge's arrowheads
  // through, including an explicit undefined for "no arrowhead".
  return config.linking.temporaryEdgeDataBuilder({
    id: 'TEMPORARY_EDGE',
    data: {},
    temporary: true,
    targetArrowhead: 'ng-diagram-arrow',
    ...partialEdge,
    source: partialEdge.source || '',
    target: partialEdge.target || '',
  });
};

/**
 * Validates a candidate connection during a relink gesture: uses
 * `edgeRelinking.validateRelink` when provided, otherwise falls back to
 * `linking.validateConnection` with the edge's endpoints in their proper
 * roles. Outside a relink, behaves exactly like `validateConnection`.
 */
export const validateRelinkOrConnection = (
  core: FlowCore,
  relink: LinkingRelinkContext | undefined,
  sourceNodeId?: string,
  sourcePortId?: string,
  targetNodeId?: string,
  targetPortId?: string,
  isFinishLinking?: boolean
) => {
  const validateRelink = relink ? core.config.edgeRelinking.validateRelink : undefined;
  if (relink && validateRelink) {
    const edge = core.getEdgeById(relink.edgeId) ?? relink.originalEdge;
    const candidateNodeId = relink.end === 'source' ? sourceNodeId : targetNodeId;
    const candidatePortId = relink.end === 'source' ? sourcePortId : targetPortId;
    const candidateNode = candidateNodeId ? core.getNodeById(candidateNodeId) : null;
    const candidatePort = candidatePortId
      ? (candidateNode?.measuredPorts?.find((port) => port.id === candidatePortId) ?? null)
      : null;
    return validateRelink(edge, relink.end, candidateNode, candidatePort);
  }
  return validateConnection(core, sourceNodeId, sourcePortId, targetNodeId, targetPortId, isFinishLinking);
};
