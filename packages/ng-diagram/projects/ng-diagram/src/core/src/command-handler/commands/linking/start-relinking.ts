import { createLinkingState } from './linking-gesture';
import type { CommandHandler, EdgeEnd } from '../../../types';
import { isEdgeEndRelinkable } from '../../../utils/relinking';
import { createTemporaryEdge, relinkPreviewBase } from './utils';

export interface StartRelinkingCommand {
  name: 'startRelinking';
  edgeId: string;
  end: EdgeEnd;
}

/**
 * Starts dragging an endpoint of an existing edge. The edge is hidden for the
 * duration of the gesture and represented by a temporary edge that mirrors its
 * type, data and arrowheads; the dragged end starts at the edge's current
 * routed endpoint. The model is untouched until finishRelinking commits —
 * cancelling simply clears the action state.
 */
export const startRelinking = async (commandHandler: CommandHandler, command: StartRelinkingCommand) => {
  const { edgeId, end } = command;
  const { flowCore } = commandHandler;
  const { actionStateManager } = flowCore;

  // A draw or another relink already owns the linking state.
  if (actionStateManager.isLinking()) {
    return;
  }

  const edge = flowCore.getEdgeById(edgeId);
  if (!edge || edge.temporary || edge.computedHidden) {
    return;
  }
  if (!isEdgeEndRelinkable(edge, end, flowCore.config.linking.defaultRelinkable)) {
    return;
  }

  // The dragged end starts where the edge currently ends: the routed endpoint
  // when available, the stored dangling position otherwise.
  const points = edge.points;
  const draggedPosition =
    end === 'source' ? (points?.[0] ?? edge.sourcePosition) : (points?.[points.length - 1] ?? edge.targetPosition);
  if (!draggedPosition) {
    return;
  }

  const previewBase = relinkPreviewBase(edge);

  const temporaryEdge =
    end === 'target'
      ? createTemporaryEdge(flowCore.config, {
          ...previewBase,
          source: edge.source,
          sourcePort: edge.sourcePort,
          sourcePosition: edge.sourcePosition ?? points?.[0],
          target: '',
          targetPort: '',
          targetPosition: draggedPosition,
        })
      : createTemporaryEdge(flowCore.config, {
          ...previewBase,
          source: '',
          sourcePort: '',
          sourcePosition: draggedPosition,
          target: edge.target,
          targetPort: edge.targetPort,
          targetPosition: edge.targetPosition ?? points?.[points.length - 1],
        });

  actionStateManager.linking = createLinkingState({
    sourceNodeId: edge.source,
    sourcePortId: edge.sourcePort ?? '',
    temporaryEdge,
    relink: { edgeId, end, originalEdge: edge },
  });

  await flowCore.applyUpdate({}, 'startRelinking');
};
