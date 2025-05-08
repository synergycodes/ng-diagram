import { CommandHandler } from '../types/command-handler.interface';

export interface StartLinkingCommand {
  name: 'startLinking';
  source: string;
  sourcePort?: string;
}

export const startLinking = (commandHandler: CommandHandler, command: StartLinkingCommand): void => {
  const { metadata, nodes } = commandHandler.flowCore.getState();
  const { source, sourcePort } = command;

  const sourceNode = nodes.find((node) => node.id === source);
  if (!sourceNode) {
    return;
  }

  commandHandler.flowCore.applyUpdate(
    {
      metadata: {
        ...metadata,
        temporaryEdge: {
          id: 'TEMPORARY_EDGE',
          source,
          sourcePort,
          sourcePosition: sourceNode.position,
          target: '',
          targetPosition: sourceNode.position,
          data: {},
        },
      },
    },
    'startLinking'
  );
};

export interface MoveTemporaryEdgeCommand {
  name: 'moveTemporaryEdge';
  position: { x: number; y: number };
}

export const moveTemporaryEdge = (commandHandler: CommandHandler, command: MoveTemporaryEdgeCommand): void => {
  const { metadata } = commandHandler.flowCore.getState();
  const { position } = command;

  if (!metadata.temporaryEdge) {
    return;
  }

  commandHandler.flowCore.applyUpdate(
    {
      metadata: {
        ...metadata,
        temporaryEdge: { ...metadata.temporaryEdge, targetPosition: position },
      },
    },
    'moveTemporaryEdge'
  );
};

export interface FinishLinkingCommand {
  name: 'finishLinking';
  target: string;
  targetPort?: string;
}

export const finishLinking = (commandHandler: CommandHandler, command: FinishLinkingCommand): void => {
  const { metadata, edges } = commandHandler.flowCore.getState();
  const { target, targetPort } = command;

  if (!metadata.temporaryEdge) {
    return;
  }

  commandHandler.flowCore.applyUpdate(
    {
      metadata: { ...metadata, temporaryEdge: null },
      edges: [...edges, { ...metadata.temporaryEdge, target, targetPort }],
    },
    'finishLinking'
  );
};
