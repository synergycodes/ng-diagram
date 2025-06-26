import type { CommandHandler, Edge } from '../../types';
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
  const { source, sourcePort } = command;

  const sourceNode = commandHandler.flowCore.getNodeById(source);
  if (!sourceNode) {
    return;
  }

  if (sourcePort && sourceNode.ports?.find((port) => port.id === sourcePort)?.type === 'target') {
    return;
  }

  const position = sourcePort ? getPortFlowPosition(sourceNode, sourcePort) : sourceNode.position;

  if (!position) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: {
        temporaryEdge: getTemporaryEdge({
          source,
          sourcePort,
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
  target?: string;
  targetPort?: string;
}

export const moveTemporaryEdge = async (commandHandler: CommandHandler, command: MoveTemporaryEdgeCommand) => {
  const { metadata } = commandHandler.flowCore.getState();
  const { position, target, targetPort: targetPortId } = command;
  const temporaryEdge = metadata.temporaryEdge;

  if (!temporaryEdge) {
    return;
  }

  let newTemporaryEdge: Edge = temporaryEdge;

  const targetNode = target ? commandHandler.flowCore.getNodeById(target) : null;

  if (target && target === temporaryEdge.target && targetPortId === temporaryEdge.targetPort) {
    return;
  }

  if (target && targetNode) {
    if (targetPortId && targetNode.ports?.find((port) => port.id === targetPortId)) {
      newTemporaryEdge = {
        ...temporaryEdge,
        target,
        targetPort: targetPortId,
      };
    } else {
      newTemporaryEdge = {
        ...temporaryEdge,
        target,
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
  target?: string;
  targetPort?: string;
}

export const finishLinking = async (commandHandler: CommandHandler, command: FinishLinkingCommand) => {
  const { metadata } = commandHandler.flowCore.getState();
  const { target, targetPort } = command;

  if (!metadata.temporaryEdge) {
    return;
  }

  const targetNode = target && commandHandler.flowCore.getNodeById(target);

  if (!targetNode) {
    await commandHandler.flowCore.applyUpdate({ metadataUpdate: { temporaryEdge: null } }, 'finishLinking');
    return;
  }

  if (targetPort && targetNode.ports?.find((port) => port.id === targetPort)?.type === 'source') {
    await commandHandler.flowCore.applyUpdate({ metadataUpdate: { temporaryEdge: null } }, 'finishLinking');
    return;
  }

  const targetPosition = !!target && !!targetPort ? getPortFlowPosition(targetNode, targetPort) : targetNode.position;

  if (!targetPosition) {
    await commandHandler.flowCore.applyUpdate({ metadataUpdate: { temporaryEdge: null } }, 'finishLinking');
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: { temporaryEdge: null },
      edgesToAdd: [getFinalEdge(metadata.temporaryEdge, { target, targetPort, targetPosition })],
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
