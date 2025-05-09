import type { CommandHandler, Edge } from '../../types';

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
        temporaryEdge: getTemporaryEdge({
          source,
          sourcePort,
          sourcePosition: sourceNode.position,
          target: '',
          targetPosition: sourceNode.position,
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

export const startLinkingFromPosition = (
  commandHandler: CommandHandler,
  command: StartLinkingFromPositionCommand
): void => {
  const { metadata } = commandHandler.flowCore.getState();
  const { position } = command;

  commandHandler.flowCore.applyUpdate(
    {
      metadata: {
        ...metadata,
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
  target?: string;
  targetPort?: string;
}

export const finishLinking = (commandHandler: CommandHandler, command: FinishLinkingCommand): void => {
  const { metadata, edges, nodes } = commandHandler.flowCore.getState();
  const { target, targetPort } = command;

  const targetNode = nodes.find((node) => node.id === target);
  if (!metadata.temporaryEdge || !targetNode) {
    return;
  }

  const newEdges: Edge[] = target ? [...edges, getFinalEdge(metadata.temporaryEdge, { target, targetPort })] : edges;

  commandHandler.flowCore.applyUpdate(
    {
      metadata: { ...metadata, temporaryEdge: null },
      edges: newEdges,
    },
    'finishLinking'
  );
};

export interface FinishLinkingToPositionCommand {
  name: 'finishLinkingToPosition';
  position: { x: number; y: number };
}

export const finishLinkingToPosition = (
  commandHandler: CommandHandler,
  command: FinishLinkingToPositionCommand
): void => {
  const { metadata, edges } = commandHandler.flowCore.getState();
  const { position } = command;

  if (!metadata.temporaryEdge) {
    return;
  }

  const newEdges: Edge[] = [
    ...edges,
    getFinalEdge(metadata.temporaryEdge, { target: '', targetPort: '', targetPosition: position }),
  ];

  commandHandler.flowCore.applyUpdate(
    { metadata: { ...metadata, temporaryEdge: null }, edges: newEdges },
    'finishLinking'
  );
};
