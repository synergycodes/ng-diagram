import { FlowCore } from '../../../flow-core';
import type { ConnectionValidationContext, Edge, EdgeEnd, FlowConfig, Port } from '../../../types';
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
  isFinishLinking?: boolean,
  context?: ConnectionValidationContext
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

  return core.config.linking.validateConnection(
    sourceNode,
    sourcePort,
    targetNode,
    targetPort,
    context ?? { reason: 'draw' }
  );
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
  // Labels stay visible on the preview while the endpoint is dragged.
  measuredLabels: edge.measuredLabels,
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
 * Structural checks for connecting an edge's `end` to `nodeId`/`portId`:
 * the node must exist and be visible; the port (when given) must exist in
 * `measuredPorts`, point the right direction for the end, and not be
 * template-hidden. Shared by the relink drop commit and `attachEdge` so both
 * accept exactly the same targets.
 */
export const isValidEndpointTarget = (core: FlowCore, end: EdgeEnd, nodeId: string, portId?: string): boolean => {
  const node = core.getNodeById(nodeId);
  if (!node || node.computedHidden) {
    return false;
  }
  if (portId) {
    const port = node.measuredPorts?.find((candidate) => candidate.id === portId);
    const wrongDirection = end === 'target' ? port?.type === 'source' : port?.type === 'target';
    if (!port || wrongDirection || core.templateVisibilityRegistry?.isPortHidden(nodeId, portId)) {
      return false;
    }
  }
  return true;
};

/**
 * Builds the validation context for a gesture: `reason: 'relink'` with the
 * live edge while an endpoint is being relinked, `reason: 'draw'` otherwise.
 */
export const connectionContextForGesture = (
  core: FlowCore,
  relink: LinkingRelinkContext | undefined
): ConnectionValidationContext =>
  relink
    ? { reason: 'relink', edge: core.getEdgeById(relink.edgeId) ?? relink.originalEdge, end: relink.end }
    : { reason: 'draw' };
