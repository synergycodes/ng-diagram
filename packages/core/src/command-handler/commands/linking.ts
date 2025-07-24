import { FlowCore } from '../../flow-core';
import type { CommandHandler, Edge, Port } from '../../types';
import { getPortFlowPosition } from '../../utils';

export const getTemporaryEdge = (partialEdge: Partial<Edge>) => ({
  id: 'TEMPORARY_EDGE',
  source: '',
  target: '',
  data: {},
  temporary: true,
  ...partialEdge,
});

export const getFinalEdge = (temporaryEdge: Edge, partialEdge: Partial<Edge>): Edge => ({
  ...temporaryEdge,
  ...partialEdge,
  temporary: false,
  id: crypto.randomUUID(),
});

export interface StartLinkingCommand {
  name: 'startLinking';
  source: string;
  sourcePort?: string;
}

export const startLinking = async (commandHandler: CommandHandler, command: StartLinkingCommand) => {
  const { source: sourceNodeId, sourcePort: sourcePortId } = command;

  const sourceNode = commandHandler.flowCore.getNodeById(sourceNodeId);
  if (!sourceNode) {
    return;
  }

  if (sourcePortId && sourceNode.ports?.find((port) => port.id === sourcePortId)?.type === 'target') {
    return;
  }

  const position = sourcePortId ? getPortFlowPosition(sourceNode, sourcePortId) : sourceNode.position;

  if (!position) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: {
        temporaryEdge: getTemporaryEdge({
          source: sourceNodeId,
          sourcePort: sourcePortId,
          sourcePosition: position,
          target: '',
          targetPosition: position,
        }),
      },
    },
    'startLinking'
  );
};

export interface StartLinkingFromPositionCommand {
  name: 'startLinkingFromPosition';
  position: { x: number; y: number };
}

export const startLinkingFromPosition = async (
  commandHandler: CommandHandler,
  command: StartLinkingFromPositionCommand
) => {
  const { position } = command;

  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: {
        temporaryEdge: getTemporaryEdge({
          source: '',
          sourcePosition: position,
          target: '',
          targetPosition: position,
        }),
      },
    },
    'startLinking'
  );
};

export interface MoveTemporaryEdgeCommand {
  name: 'moveTemporaryEdge';
  position: { x: number; y: number };
}

export const moveTemporaryEdge = async (commandHandler: CommandHandler, command: MoveTemporaryEdgeCommand) => {
  const { metadata } = commandHandler.flowCore.getState();
  const { position } = command;
  const temporaryEdge = metadata.temporaryEdge;

  if (!temporaryEdge) {
    return;
  }

  const targetPort = commandHandler.flowCore.getNearestPortInRange(position, 10);
  const isProperTarget = targetPort && isProperTargetPort(targetPort, temporaryEdge.source, temporaryEdge.sourcePort);
  const targetNodeId = isProperTarget ? targetPort.nodeId : '';
  const targetPortId = isProperTarget ? targetPort.id : '';

  let newTemporaryEdge: Edge = temporaryEdge;

  const targetNode = targetNodeId ? commandHandler.flowCore.getNodeById(targetNodeId) : null;

  // early return if the target port is the same as the temporary edge target port
  if (targetNodeId && targetNodeId === temporaryEdge.target && targetPortId === temporaryEdge.targetPort) {
    return;
  }

  if (targetNodeId && targetNode) {
    if (
      !validateConnection(
        commandHandler.flowCore,
        temporaryEdge.source,
        temporaryEdge.sourcePort,
        targetNodeId,
        targetPortId
      )
    ) {
      newTemporaryEdge = {
        ...temporaryEdge,
        target: '',
        targetPort: '',
        targetPosition: position,
      };
    } else if (targetPortId && targetNode.ports?.find((port) => port.id === targetPortId)) {
      newTemporaryEdge = {
        ...temporaryEdge,
        target: targetNodeId,
        targetPort: targetPortId,
      };
    } else {
      newTemporaryEdge = {
        ...temporaryEdge,
        target: targetNodeId,
        targetPort: '',
      };
    }
  } else {
    newTemporaryEdge = {
      ...temporaryEdge,
      target: '',
      targetPort: '',
      targetPosition: position,
    };
  }

  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: { temporaryEdge: newTemporaryEdge },
    },
    'moveTemporaryEdge'
  );
};

export interface FinishLinkingCommand {
  name: 'finishLinking';
}

export const finishLinking = async (commandHandler: CommandHandler) => {
  const { metadata } = commandHandler.flowCore.getState();

  const temporaryEdge = metadata.temporaryEdge;

  if (!temporaryEdge) {
    return;
  }

  const targetNodeId = temporaryEdge.target;
  const targetPortId = temporaryEdge.targetPort;

  const targetNode = targetNodeId && commandHandler.flowCore.getNodeById(targetNodeId);

  if (
    !validateConnection(
      commandHandler.flowCore,
      temporaryEdge.source,
      temporaryEdge.sourcePort,
      targetNodeId,
      targetPortId,
      true
    )
  ) {
    await commandHandler.flowCore.applyUpdate({ metadataUpdate: { temporaryEdge: null } }, 'finishLinking');
    return;
  }

  if (!targetNode) {
    await commandHandler.flowCore.applyUpdate({ metadataUpdate: { temporaryEdge: null } }, 'finishLinking');
    return;
  }

  if (targetPortId && targetNode.ports?.find((port) => port.id === targetPortId)?.type === 'source') {
    await commandHandler.flowCore.applyUpdate({ metadataUpdate: { temporaryEdge: null } }, 'finishLinking');
    return;
  }

  const targetPosition =
    targetNodeId && targetPortId ? getPortFlowPosition(targetNode, targetPortId) : targetNode.position;

  if (!targetPosition) {
    await commandHandler.flowCore.applyUpdate({ metadataUpdate: { temporaryEdge: null } }, 'finishLinking');
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: { temporaryEdge: null },
      edgesToAdd: [getFinalEdge(temporaryEdge, { target: targetNodeId, targetPort: targetPortId, targetPosition })],
    },
    'finishLinking'
  );
};

export interface FinishLinkingToPositionCommand {
  name: 'finishLinkingToPosition';
  position: { x: number; y: number };
}

export const finishLinkingToPosition = async (
  commandHandler: CommandHandler,
  command: FinishLinkingToPositionCommand
) => {
  const { metadata } = commandHandler.flowCore.getState();
  const { position } = command;

  if (!metadata.temporaryEdge) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: { temporaryEdge: null },
      edgesToAdd: [getFinalEdge(metadata.temporaryEdge, { target: '', targetPort: '', targetPosition: position })],
    },
    'finishLinking'
  );
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
  const sourcePort = sourcePortId ? sourceNode?.ports?.find((port) => port.id === sourcePortId) : null;

  const targetPort = targetPortId ? targetNode?.ports?.find((port) => port.id === targetPortId) : null;

  if (!isFinishLinking && !targetPort && sourcePort) {
    return true;
  }

  return false;
};
