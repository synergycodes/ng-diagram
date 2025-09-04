import type { CommandHandler, Edge } from '../../../types';
import { createTemporaryEdge, isProperTargetPort, validateConnection } from './utils';

export interface MoveTemporaryEdgeCommand {
  name: 'moveTemporaryEdge';
  position: { x: number; y: number };
}

interface TargetPortInfo {
  targetNodeId: string;
  targetPortId: string;
  isValid: boolean;
}

export const getTargetPortInfo = (
  commandHandler: CommandHandler,
  position: { x: number; y: number },
  temporaryEdge: Edge
): TargetPortInfo => {
  const targetPort = commandHandler.flowCore.getNearestPortInRange(
    position,
    commandHandler.flowCore.config.linking.portSnapDistance
  );
  const isProperTarget = targetPort && isProperTargetPort(targetPort, temporaryEdge.source, temporaryEdge.sourcePort);

  return {
    targetNodeId: isProperTarget ? targetPort.nodeId : '',
    targetPortId: isProperTarget ? targetPort.id : '',
    isValid: !!isProperTarget,
  };
};

export const createNewTemporaryEdge = (
  commandHandler: CommandHandler,
  temporaryEdge: Edge,
  targetPortInfo: TargetPortInfo,
  position: { x: number; y: number }
): Edge => {
  const { targetNodeId, targetPortId } = targetPortInfo;

  const source = temporaryEdge.source || '';
  const sourcePort = temporaryEdge.sourcePort || '';

  const createFloatingEdge = () =>
    createTemporaryEdge(commandHandler.flowCore.config, {
      source,
      sourcePort,
      target: '',
      targetPort: '',
      targetPosition: position,
    });

  if (!targetNodeId) {
    return createFloatingEdge();
  }

  const targetNode = commandHandler.flowCore.getNodeById(targetNodeId);
  if (!targetNode) {
    return createFloatingEdge();
  }

  const isConnectionValid = validateConnection(
    commandHandler.flowCore,
    temporaryEdge.source,
    temporaryEdge.sourcePort,
    targetNodeId,
    targetPortId
  );

  if (!isConnectionValid) {
    return createFloatingEdge();
  }

  if (targetPortId && targetNode.ports?.find((port) => port.id === targetPortId)) {
    return createTemporaryEdge(commandHandler.flowCore.config, {
      source,
      sourcePort,
      target: targetNodeId,
      targetPort: targetPortId,
      targetPosition: position,
    });
  }

  return createTemporaryEdge(commandHandler.flowCore.config, {
    source,
    sourcePort,
    target: targetNodeId,
    targetPort: '',
    targetPosition: position,
  });
};

export const isSameTarget = (temporaryEdge: Edge, targetNodeId: string, targetPortId: string): boolean => {
  return targetNodeId === temporaryEdge.target && targetPortId === temporaryEdge.targetPort;
};

export const moveTemporaryEdge = async (commandHandler: CommandHandler, command: MoveTemporaryEdgeCommand) => {
  const { position } = command;
  const temporaryEdge = commandHandler.flowCore.actionStateManager.linking?.temporaryEdge;

  if (!temporaryEdge) {
    return;
  }

  const targetPortInfo = getTargetPortInfo(commandHandler, position, temporaryEdge);

  if (
    targetPortInfo.targetNodeId &&
    isSameTarget(temporaryEdge, targetPortInfo.targetNodeId, targetPortInfo.targetPortId)
  ) {
    return;
  }

  const newTemporaryEdge = createNewTemporaryEdge(commandHandler, temporaryEdge, targetPortInfo, position);

  commandHandler.flowCore.actionStateManager.linking.temporaryEdge = newTemporaryEdge;

  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: { temporaryEdge: newTemporaryEdge },
    },
    'moveTemporaryEdge'
  );
};
