import type { CommandHandler, Edge, EdgeEnd, Point } from '../../../types';
import type { LinkingRelinkContext } from '../../../types/action-state.interface';
import {
  createTemporaryEdge,
  isProperSourcePort,
  isProperTargetPort,
  relinkPreviewBase,
  validateRelinkOrConnection,
} from './utils';

export interface MoveTemporaryEdgeCommand {
  name: 'moveTemporaryEdge';
  position: Point;
}

interface TargetPortInfo {
  targetNodeId: string;
  targetPortId: string;
  isValid: boolean;
}

/**
 * Finds the port the dragged end of the temporary edge would snap to at
 * `position`. For a normal draw (and a target-end relink) the candidate must
 * be target-capable; while relinking the source end it must be source-capable.
 */
export const getTargetPortInfo = (
  commandHandler: CommandHandler,
  position: Point,
  temporaryEdge: Edge,
  draggedEnd: EdgeEnd = 'target'
): TargetPortInfo => {
  const candidatePort = commandHandler.flowCore.getNearestPortInRange(
    position,
    commandHandler.flowCore.config.linking.portSnapDistance
  );
  const isProperCandidate =
    candidatePort &&
    (draggedEnd === 'target'
      ? isProperTargetPort(candidatePort, temporaryEdge.source, temporaryEdge.sourcePort)
      : isProperSourcePort(candidatePort, temporaryEdge.target, temporaryEdge.targetPort));

  return {
    targetNodeId: isProperCandidate ? candidatePort.nodeId : '',
    targetPortId: isProperCandidate ? candidatePort.id : '',
    isValid: !!isProperCandidate,
  };
};

export const createNewTemporaryEdge = (
  commandHandler: CommandHandler,
  temporaryEdge: Edge,
  targetPortInfo: TargetPortInfo,
  position: Point,
  draggedEnd: EdgeEnd = 'target',
  relink?: LinkingRelinkContext
): Edge => {
  const { targetNodeId: candidateNodeId, targetPortId: candidatePortId } = targetPortInfo;
  const { config } = commandHandler.flowCore;

  // The end that stays anchored while the other follows the pointer.
  const fixedEndFields: Partial<Edge> =
    draggedEnd === 'target'
      ? {
          source: temporaryEdge.source || '',
          sourcePort: temporaryEdge.sourcePort || '',
          sourcePosition: temporaryEdge.sourcePosition,
        }
      : {
          target: temporaryEdge.target || '',
          targetPort: temporaryEdge.targetPort || '',
          targetPosition: temporaryEdge.targetPosition,
        };

  const buildPreview = (draggedEndFields: Partial<Edge>): Edge =>
    createTemporaryEdge(config, {
      ...(relink ? relinkPreviewBase(relink.originalEdge) : {}),
      ...fixedEndFields,
      ...draggedEndFields,
    });

  const createFloatingEdge = () =>
    buildPreview(
      draggedEnd === 'target'
        ? { target: '', targetPort: '', targetPosition: position }
        : { source: '', sourcePort: '', sourcePosition: position }
    );

  if (!candidateNodeId) {
    return createFloatingEdge();
  }

  const candidateNode = commandHandler.flowCore.getNodeById(candidateNodeId);
  if (!candidateNode) {
    return createFloatingEdge();
  }

  const isConnectionValid = validateRelinkOrConnection(
    commandHandler.flowCore,
    relink,
    draggedEnd === 'target' ? temporaryEdge.source : candidateNodeId,
    draggedEnd === 'target' ? temporaryEdge.sourcePort : candidatePortId,
    draggedEnd === 'target' ? candidateNodeId : temporaryEdge.target,
    draggedEnd === 'target' ? candidatePortId : temporaryEdge.targetPort
  );

  if (!isConnectionValid) {
    return createFloatingEdge();
  }

  const hasMeasuredCandidatePort =
    candidatePortId && candidateNode.measuredPorts?.find((port) => port.id === candidatePortId);

  return buildPreview(
    draggedEnd === 'target'
      ? {
          target: candidateNodeId,
          targetPort: hasMeasuredCandidatePort ? candidatePortId : '',
          targetPosition: position,
        }
      : {
          source: candidateNodeId,
          sourcePort: hasMeasuredCandidatePort ? candidatePortId : '',
          sourcePosition: position,
        }
  );
};

export const isSameTarget = (
  temporaryEdge: Edge,
  targetNodeId: string,
  targetPortId: string,
  draggedEnd: EdgeEnd = 'target'
): boolean => {
  return draggedEnd === 'target'
    ? targetNodeId === temporaryEdge.target && targetPortId === temporaryEdge.targetPort
    : targetNodeId === temporaryEdge.source && targetPortId === temporaryEdge.sourcePort;
};

export const moveTemporaryEdge = async (commandHandler: CommandHandler, command: MoveTemporaryEdgeCommand) => {
  const { position } = command;
  const linking = commandHandler.flowCore.actionStateManager.linking;
  const temporaryEdge = linking?.temporaryEdge;

  if (!linking || !temporaryEdge) {
    return;
  }

  const draggedEnd = linking.relink?.end ?? 'target';
  const targetPortInfo = getTargetPortInfo(commandHandler, position, temporaryEdge, draggedEnd);

  if (
    targetPortInfo.targetNodeId &&
    isSameTarget(temporaryEdge, targetPortInfo.targetNodeId, targetPortInfo.targetPortId, draggedEnd)
  ) {
    return;
  }

  const newTemporaryEdge = createNewTemporaryEdge(
    commandHandler,
    temporaryEdge,
    targetPortInfo,
    position,
    draggedEnd,
    linking.relink
  );

  commandHandler.flowCore.actionStateManager.linking = {
    ...linking,
    temporaryEdge: newTemporaryEdge,
  };

  await commandHandler.flowCore.applyUpdate({}, 'moveTemporaryEdge');
};
