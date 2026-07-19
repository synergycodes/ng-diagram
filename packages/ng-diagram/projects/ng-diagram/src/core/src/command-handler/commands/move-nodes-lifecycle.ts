import type { CommandHandler } from '../../types';

export interface MoveNodesStartCommand {
  name: 'moveNodesStart';
  /** Ids of the nodes the starting gesture drags — reported by `nodeDragStarted`. */
  nodeIds?: string[];
}

export const moveNodesStart = async (commandHandler: CommandHandler, command: MoveNodesStartCommand) => {
  await commandHandler.flowCore.applyUpdate(
    command.nodeIds ? { gestureNodeIds: command.nodeIds } : {},
    'moveNodesStart'
  );
};

export interface MoveNodesStopCommand {
  name: 'moveNodesStop';
  /** Ids of the nodes the ending gesture dragged — reported by `nodeDragEnded`. */
  nodeIds?: string[];
}

export const moveNodesStop = async (commandHandler: CommandHandler, command: MoveNodesStopCommand) => {
  await commandHandler.flowCore.applyUpdate(
    command.nodeIds ? { gestureNodeIds: command.nodeIds } : {},
    'moveNodesStop'
  );
};
